#!/bin/bash

# ============================================
# AutoSphere Fix Script
# Safely checks and applies fixes
# ============================================

echo "🚗 AutoSphere Fix Script"
echo "========================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Backup directory
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo -e "${BLUE}📁 Backups will be saved to: $BACKUP_DIR${NC}"
echo ""

# ============================================
# 1. FIX: carwash → car_wash
# ============================================
echo -e "${BLUE}🔧 Fix 1: carwash → car_wash${NC}"

FRONTEND_SERVICE_FILE="./frontend/src/pages/user/BookService.jsx"
FRONTEND_APPOINTMENT_FILE="./frontend/src/pages/user/Appointments.jsx"

if [ -f "$FRONTEND_SERVICE_FILE" ]; then
    if grep -q "'carwash'" "$FRONTEND_SERVICE_FILE"; then
        echo -e "${YELLOW}  ⚠️  Found 'carwash' in BookService.jsx${NC}"
        cp "$FRONTEND_SERVICE_FILE" "$BACKUP_DIR/BookService.jsx.bak"
        sed -i "s/'carwash'/'car_wash'/g" "$FRONTEND_SERVICE_FILE"
        echo -e "${GREEN}  ✅ Fixed 'carwash' → 'car_wash' in BookService.jsx${NC}"
    else
        echo -e "${GREEN}  ✅ No 'carwash' found in BookService.jsx${NC}"
    fi
else
    echo -e "${RED}  ❌ BookService.jsx not found${NC}"
fi

if [ -f "$FRONTEND_APPOINTMENT_FILE" ]; then
    if grep -q "carwash:" "$FRONTEND_APPOINTMENT_FILE"; then
        echo -e "${YELLOW}  ⚠️  Found 'carwash:' in Appointments.jsx${NC}"
        cp "$FRONTEND_APPOINTMENT_FILE" "$BACKUP_DIR/Appointments.jsx.bak"
        sed -i "s/carwash:/car_wash:/g" "$FRONTEND_APPOINTMENT_FILE"
        echo -e "${GREEN}  ✅ Fixed 'carwash:' → 'car_wash:' in Appointments.jsx${NC}"
    else
        echo -e "${GREEN}  ✅ No 'carwash:' found in Appointments.jsx${NC}"
    fi
else
    echo -e "${RED}  ❌ Appointments.jsx not found${NC}"
fi

echo ""

# ============================================
# 2. FIX: Phone number display and call feature
# ============================================
echo -e "${BLUE}📞 Fix 2: Add Phone Call Feature${NC}"

PHONE_BUTTON_FILE="./frontend/src/components/PhoneCallButton.jsx"

if [ ! -f "$PHONE_BUTTON_FILE" ]; then
    echo -e "${YELLOW}  ⚠️  PhoneCallButton.jsx not found - creating...${NC}"
    mkdir -p "./frontend/src/components"
    cat > "$PHONE_BUTTON_FILE" << 'EOF'
import React from 'react';

const PhoneCallButton = ({ phoneNumber, label = 'Call', size = 'md', variant = 'outline' }) => {
  if (!phoneNumber) return null;

  const cleanNumber = phoneNumber.replace(/[\s\-().]/g, '');
  
  const sizeClasses = {
    sm: { padding: '4px 10px', fontSize: '0.75rem' },
    md: { padding: '6px 14px', fontSize: '0.875rem' },
    lg: { padding: '10px 20px', fontSize: '1rem' },
  };

  const variantStyles = {
    outline: { background: 'transparent', border: '1.5px solid #1976d2', color: '#1976d2' },
    solid: { background: '#1976d2', border: '1.5px solid #1976d2', color: 'white' },
    ghost: { background: 'transparent', border: 'none', color: '#1976d2', textDecoration: 'underline' },
  };

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    borderRadius: '6px',
    cursor: 'pointer',
    textDecoration: 'none',
    ...sizeClasses[size],
    ...variantStyles[variant],
  };

  return (
    <a
      href={`tel:${cleanNumber}`}
      className="phone-call-btn"
      style={style}
      aria-label={`Call ${label} at ${phoneNumber}`}
    >
      <span>📞</span> {label}
    </a>
  );
};

export default PhoneCallButton;
EOF
    echo -e "${GREEN}  ✅ Created PhoneCallButton.jsx${NC}"
else
    echo -e "${GREEN}  ✅ PhoneCallButton.jsx already exists${NC}"
fi

echo ""

# ============================================
# 3. FIX: Appointment Details - Add Customer Phone
# ============================================
echo -e "${BLUE}📋 Fix 3: Add Customer Phone to Appointment Details${NC}"

APPOINTMENT_DETAILS_FILE="./frontend/src/pages/user/AppointmentDetails.jsx"

if [ -f "$APPOINTMENT_DETAILS_FILE" ]; then
    if grep -q "customerPhone" "$APPOINTMENT_DETAILS_FILE"; then
        echo -e "${GREEN}  ✅ Customer phone already in AppointmentDetails.jsx${NC}"
    else
        echo -e "${YELLOW}  ⚠️  Adding customer phone to AppointmentDetails.jsx${NC}"
        cp "$APPOINTMENT_DETAILS_FILE" "$BACKUP_DIR/AppointmentDetails.jsx.bak"
        
        # Add customerPhone to the transformed appointment object
        sed -i '/customerName:/a\          customerPhone: booking.user?.phone || '\'''\''', ' "$APPOINTMENT_DETAILS_FILE"
        sed -i '/customerName:/a\          customerEmail: booking.user?.email || '\'''\''', ' "$APPOINTMENT_DETAILS_FILE"
        
        echo -e "${GREEN}  ✅ Added customer phone/email to AppointmentDetails.jsx${NC}"
    fi
else
    echo -e "${RED}  ❌ AppointmentDetails.jsx not found${NC}"
fi

echo ""

# ============================================
# 4. FIX: Service Provider Services
# ============================================
echo -e "${BLUE}🛠️  Fix 4: Service Provider Services${NC}"

SERVICES_FILE="./frontend/src/pages/service-provider/Services.jsx"

if [ -f "$SERVICES_FILE" ]; then
    if grep -q "'car_wash'" "$SERVICES_FILE"; then
        echo -e "${GREEN}  ✅ Categories already use car_wash${NC}"
    else
        echo -e "${YELLOW}  ⚠️  Updating categories in Services.jsx${NC}"
        cp "$SERVICES_FILE" "$BACKUP_DIR/Services.jsx.bak"
        sed -i "s/'carwash'/'car_wash'/g" "$SERVICES_FILE"
        sed -i "s/'car_wash'/'car_wash'/g" "$SERVICES_FILE"
        echo -e "${GREEN}  ✅ Updated categories in Services.jsx${NC}"
    fi
else
    echo -e "${RED}  ❌ Services.jsx not found${NC}"
fi

echo ""

# ============================================
# 5. FIX: Admin Bulk Actions
# ============================================
echo -e "${BLUE}👥 Fix 5: Admin Bulk User Management${NC}"

ADMIN_USERS_FILE="./frontend/src/pages/admin/Users.jsx"

if [ -f "$ADMIN_USERS_FILE" ]; then
    if grep -q "bulkStatusUpdate" "$ADMIN_USERS_FILE"; then
        echo -e "${GREEN}  ✅ Bulk actions already in Admin Users${NC}"
    else
        echo -e "${YELLOW}  ⚠️  Adding bulk actions to Admin Users${NC}"
        cp "$ADMIN_USERS_FILE" "$BACKUP_DIR/AdminUsers.jsx.bak"
        echo -e "${GREEN}  ⚠️  Please manually add bulk actions to Admin Users (see documentation)${NC}"
    fi
else
    echo -e "${RED}  ❌ Admin Users.jsx not found${NC}"
fi

echo ""

# ============================================
# 6. FIX: Business Signup Link
# ============================================
echo -e "${BLUE}🏢 Fix 6: Business Signup Registration${NC}"

PROVIDER_SIGNUP="./frontend/src/pages/public/ProviderSignup.jsx"
BUSINESS_SIGNUP="./frontend/src/pages/public/BusinessSignup.jsx"

if [ -f "$PROVIDER_SIGNUP" ]; then
    echo -e "${GREEN}  ✅ ProviderSignup.jsx exists${NC}"
else
    echo -e "${RED}  ❌ ProviderSignup.jsx not found${NC}"
fi

if [ -f "$BUSINESS_SIGNUP" ]; then
    echo -e "${GREEN}  ✅ BusinessSignup.jsx exists${NC}"
else
    echo -e "${RED}  ❌ BusinessSignup.jsx not found${NC}"
fi

echo ""

# ============================================
# 7. FIX: Mobile Responsive Menu
# ============================================
echo -e "${BLUE}📱 Fix 7: Mobile Responsive Menu${NC}"

NAV_FILE="./frontend/src/components/Navigation.jsx"

if [ -f "$NAV_FILE" ]; then
    if grep -q "mobileMenuOpen" "$NAV_FILE"; then
        echo -e "${GREEN}  ✅ Mobile menu already exists${NC}"
    else
        echo -e "${YELLOW}  ⚠️  Adding mobile menu to Navigation${NC}"
        echo -e "${GREEN}  ⚠️  Please manually add mobile menu (see documentation)${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠️  Navigation.jsx not found - checking App.jsx${NC}"
    if grep -q "mobileMenuOpen" "./frontend/src/App.jsx"; then
        echo -e "${GREEN}  ✅ Mobile menu in App.jsx${NC}"
    else
        echo -e "${YELLOW}  ⚠️  No mobile menu found - please add (see documentation)${NC}"
    fi
fi

echo ""

# ============================================
# 8. FIX: Create Notification Context
# ============================================
echo -e "${BLUE}🔔 Fix 8: Notification Context${NC}"

NOTIFICATION_CONTEXT="./frontend/src/contexts/NotificationContext.jsx"

if [ -f "$NOTIFICATION_CONTEXT" ]; then
    echo -e "${GREEN}  ✅ NotificationContext.jsx exists${NC}"
else
    echo -e "${YELLOW}  ⚠️  Creating NotificationContext.jsx${NC}"
    mkdir -p "./frontend/src/contexts"
    cat > "$NOTIFICATION_CONTEXT" << 'EOF'
import { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllRead,
      setNotifications,
      setUnreadCount,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
EOF
    echo -e "${GREEN}  ✅ Created NotificationContext.jsx${NC}"
fi

echo ""

# ============================================
# 9. FIX: .env to use SQLite (if PostgreSQL fails)
# ============================================
echo -e "${BLUE}🗄️  Fix 9: Database Configuration${NC}"

ENV_FILE="./backend/.env"

if [ -f "$ENV_FILE" ]; then
    if grep -q "DB_HOST=localhost" "$ENV_FILE" && grep -q "DB_PORT=5432" "$ENV_FILE"; then
        echo -e "${YELLOW}  ⚠️  PostgreSQL configured. Make sure PostgreSQL is running!${NC}"
        echo -e "${YELLOW}     If not, run: sudo service postgresql start${NC}"
        echo -e "${YELLOW}     Or switch to SQLite by commenting out PostgreSQL lines${NC}"
    else
        echo -e "${GREEN}  ✅ Database configuration looks correct${NC}"
    fi
else
    echo -e "${RED}  ❌ .env file not found${NC}"
fi

echo ""

# ============================================
# 10. FIX: Add PhoneLink component for appointments
# ============================================
echo -e "${BLUE}📱 Fix 10: Add PhoneLink component${NC}"

PHONE_LINK_FILE="./frontend/src/components/PhoneLink.jsx"

if [ ! -f "$PHONE_LINK_FILE" ]; then
    echo -e "${YELLOW}  ⚠️  PhoneLink.jsx not found - creating...${NC}"
    mkdir -p "./frontend/src/components"
    cat > "$PHONE_LINK_FILE" << 'EOF'
import React from 'react';

const PhoneLink = ({ phone, label, size = 'md' }) => {
  if (!phone) return null;

  const cleanNumber = phone.replace(/[\s\-().]/g, '');
  
  const sizeClasses = {
    sm: 'font-size: 0.75rem; padding: 2px 8px;',
    md: 'font-size: 0.875rem; padding: 4px 12px;',
    lg: 'font-size: 1rem; padding: 8px 16px;',
  };

  return (
    <a
      href={`tel:${cleanNumber}`}
      className="phone-link"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        color: '#1976d2',
        textDecoration: 'none',
        ...sizeClasses[size],
      }}
    >
      📞 {label || phone}
    </a>
  );
};

export default PhoneLink;
EOF
    echo -e "${GREEN}  ✅ Created PhoneLink.jsx${NC}"
else
    echo -e "${GREEN}  ✅ PhoneLink.jsx already exists${NC}"
fi

echo ""

# ============================================
# Summary
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Fix script completed!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}📦 Backups saved to: $BACKUP_DIR${NC}"
echo ""
echo -e "${YELLOW}⚠️  Next steps:${NC}"
echo "  1. Make sure PostgreSQL is running: sudo service postgresql start"
echo "  2. Start backend: cd backend && npm run dev"
echo "  3. Start frontend: cd frontend && npm run dev"
echo "  4. Visit: http://localhost:3000"
echo ""
echo -e "${BLUE}📝 Manual fixes needed:${NC}"
echo "  - Admin bulk actions (see documentation)"
echo "  - Mobile menu (see documentation)"
echo "  - Verify appointment details show customer phone"
echo ""
echo -e "${GREEN}Happy coding! 🚗${NC}"
