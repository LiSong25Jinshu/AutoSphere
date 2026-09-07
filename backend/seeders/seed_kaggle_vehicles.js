import fs from 'fs';
import csvParser from 'csv-parser';
import User from "../src/models/User.js";
import Vehicle from "../src/models/Vehicle.js";
import { sequelize } from "../src/config/database.js";
import { resolve } from 'dns';
import { features } from 'process';
import { error, log } from 'console';

const CSV_PATH = '../ai_service/data/autosphere_vehicles_dataset_images.csv';

// Get or Create System Dealer
async function getOrCreateSystemDealer() {
    const [dealer] = await User.findOrCreate({
        where: { email: 'inventory@autosphere.system'},
        defaults: {
            firstName: 'AutoSphere',
            lastName: 'Inventory',
            role: 'dealer',
            isverified: true
        },
    });

    if (!dealer.passwordHash) {
        await dealer.setPassword('SystemInventory@123');
        await dealer.save();
    }

    return dealer.id;
}

// Normalizers - map CSV text to Postgres enums
function normalizerFuelType(raw) {
    const s = (raw || '').toString().toLowerCase();
    if (s.includes('plug')) return 'plug_in_hybrid';
    if (s.includes('hybrid')) return 'hybrid';
    if (s.includes('electric') || s === 'ev') return 'electric';
    if (s.includes('diesel')) return 'diesel';
    return 'gasoline';  // Covers petrol, unleaded, cng, lpg fallback
}

function normalizeTransmission(raw) {
    const s = (raw || '').toString().toLowerCase();
    if (s.includes('cvt')) return 'cvt';
    if (s.includes('manual')) return 'manual';
    return 'automatic';  // Fallback for unknown transmission types
}

function normalizeBodyType(raw) {
    const s = (raw || '').toString().toLowerCase();
    if (s.includes('convertible')) return 'convertible';
    if (s.includes('coupe')) return 'coupe';
    if (s.includes('wagon')) return 'wagon';
    if (s.includes('van')) return 'van';
    if (s.includes('pickup') || s.includes('truck')) return 'truck';
    if (s.includes('hatchback')) return 'hatchback';
    if (s.includes('suv') || s.includes('crossover')) return 'suv';
    return 'sedan';  // Fallback for unknown body types
}

function normalizeCondition(raw) {
    const s = (raw || '').toString().toLowerCase().trim();
    if (s.includes('foreign')) return 'foreign_used';
    if (s.includes('local')) return 'local_used';
    if (s.includes('certified')) return 'certified_pre_owned';
    if (s.includes('new')) return 'new';
    return 'used';  // fallback for the original Kaggle CSVs, which have no condition column
}

function parseFeatures(raw) {
    if (!raw) return [];
    return raw.toString().split(';').map(f => f.trim()).filter(Boolean);
}

function toIntorNull(v) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
}

function toFloatorNull(v) {
    if (v === undefined || v === null || v === '') return null;
    const n = parseFloat(v.toString().replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : null;
}

// Read CSV
function readCsv(filePath) {
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => rows.push(row))
            .on('end', () => resolve(rows))
            .on('error', reject);
    });
}

// Build vehicle rows and insert in batches
async function seedVehicles(dealerId) {
    if (!fs.existsSync(CSV_PATH)) {
        console.log(`⚠️ ${CSV_PATH} not found - run the Python export first.`);
        return 0;
    }

    const rawRows = await readCsv(CSV_PATH);
    const vehicles = [];

    for (const row of rawRows) {
        const make = row['make'];
        const model = row['model'];
        const year = toIntorNull(row['year']);
        const price = toFloatorNull(row['price']);

        if (!make || !model || !year || price === null || price <= 0) continue;

        vehicles.push({
            dealerId,
            make: make.toString().slice(0, 50),
            model: model.toString().slice(0, 50),
            year,
            price,
            mileage: toIntorNull(row['mileage']),
            condition: normalizeCondition(row['condition']),
            fuelType: normalizerFuelType(row['fuel_type']),
            transmission: normalizeTransmission(row['transmission']),
            bodyType: normalizeBodyType(row['body_type']),
            description: row['description'] || '',
            features : parseFeatures(row['features']),
            images: row['image_url'] ? [row['image_url']] : [],
            status: 'available',
            isfeatured: false,
            viewCount: 0,
        });
    }

    const BATCH_SIZE = 500;
    let inserted = 0;
    for (let i = 0; i < vehicles.length; i += BATCH_SIZE) {
        const batch = vehicles.slice(i, i + BATCH_SIZE);
        await Vehicle.bulkCreate(batch, {validate: true, ignoreDuplicates: true});
        inserted += batch.length;
        console.log(`   ...inserted ${inserted}/${vehicles.length}`);
    }

    return inserted;
}

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ DB connected');
        
        const dealerId = await getOrCreateSystemDealer();
        console.log(`✅ System Dealer ready (id: ${dealerId})`);
        
        const count = await seedVehicles(dealerId);
        console.log(`🎉 Done. ${count} vehicles seeded under dealerId ${dealerId}.`);
        process.exit(0);
    }   catch (err) {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    }
})();
