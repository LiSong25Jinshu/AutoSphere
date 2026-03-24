import express from 'express';
import axios from 'axios';
// import { redisClient } from '../config/redis.js';

const router = express.Router();
const AI_SERVICE_URL = 'http://localhost:5002';
// const CACHE_TTL = 3600; // Cache for 1 hour

// GET /api/recommendations/:userID
router.get('/:userID', async (req,res) => {
    const { userID } = req.paramas;
    const cacheKey = `recs:${userId}`;

    try {
        // // Check Redis Cache
        // const cached = await redisClient.get(cacheKey);
        // if (cached) {
        //     return res.json({ source: 'cache', ...JSON.parse(cached) });
        // }

        // Call Python AI service
        const response = await axios.get(
            `${AI_SERVICE_URL}/recommendations/${userId}?n=10`
        );

        const data = response.data;

        // // Store in Redis cache
        // await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(data));

        return res.json({ source: 'ai', ...data });

    } catch (error) {
        console.error('AI service:', error.message);
        res.status(500).json({ error: 'Could not fetch recommendations' });
    }
});

export = router;
