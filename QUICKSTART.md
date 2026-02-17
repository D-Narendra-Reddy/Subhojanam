# Subhojanam - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js installed
- MongoDB running (local or Atlas)
- Razorpay account (test mode)

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with MongoDB URI and Razorpay keys
npm run dev
```
✅ Backend running at http://localhost:5000

### 2. Frontend Setup
```bash
cd frontend
# Edit config.js - ensure BACKEND_URL is http://localhost:5000/api
python3 -m http.server 3000
# OR use VS Code Live Server
```
✅ Frontend running at http://localhost:3000

### 3. Test Payment
- Open http://localhost:3000
- Click "Donate Now" → Select ₹500
- Fill form → "Proceed to Pay"
- Test Card: **4111 1111 1111 1111**, CVV: 123
- Check MongoDB: `db.donations.find()`

## 📁 Project Structure
```
Subhojanam/
├── frontend/
│   ├── index.html          (Added Razorpay SDK)
│   ├── script.js           (Integrated backend APIs)
│   ├── config.js           (NEW: Backend URL config)
│   ├── styles.css
│   └── assests/
├── backend/
│   ├── server.js           (Express app)
│   ├── config/db.js        (MongoDB connection)
│   ├── models/Donation.js  (Data schema)
│   ├── routes/
│   │   ├── donation.js     (Create, verify, stats APIs)
│   │   └── webhook.js      (Razorpay events)
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── INTEGRATION.md          (Detailed integration guide)
└── QUICKSTART.md          (This file)
```

## 🔧 Frontend Changes Summary

### New File: `config.js`
```javascript
const API_CONFIG = {
    BACKEND_URL: 'http://localhost:5000/api'
};
```

### Modified: `index.html`
Added before `</body>`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script src="config.js"></script>
```

### Modified: `script.js`
Replaced lines 264-340 (form submission handler):
- ❌ Old: Simulated payment with setTimeout
- ✅ New: Real Razorpay integration with backend APIs

**Flow:**
1. Collect form data
2. POST to `/api/donations/create-order`
3. Open Razorpay checkout
4. On success, POST to `/api/donations/verify-payment`
5. Redirect to thank you page

## 🧪 API Endpoints

### Create Order
```bash
POST http://localhost:5000/api/donations/create-order
Content-Type: application/json

{
  "donorName": "John Doe",
  "donorEmail": "john@example.com",
  "donorPhone": "9876543210",
  "amount": 500
}
```

### Verify Payment
```bash
POST http://localhost:5000/api/donations/verify-payment

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

### Get Stats
```bash
GET http://localhost:5000/api/donations/stats/summary
```

## 🔐 Environment Setup

### Backend `.env`
```env
MONGODB_URI=mongodb://localhost:27017/subhojanam
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxx
FRONTEND_URL=http://localhost:3000
```

### Frontend `config.js`
```javascript
BACKEND_URL: 'http://localhost:5000/api'
```

## 📊 Database Schema
Each donation stores:
- Donor info (name, email, phone)
- Amount & type (onetime/monthly)
- Occasion (birthday, anniversary, etc.)
- 80G certificate request (+ PAN)
- Maha Prasadam request (+ address)
- Razorpay payment details
- Payment status tracking
- Timestamps

## ✅ Testing Checklist

- [ ] Backend server running (`npm run dev`)
- [ ] Frontend server running (port 3000)
- [ ] MongoDB connected
- [ ] Razorpay test keys in `.env`
- [ ] `BACKEND_URL` correct in `config.js`
- [ ] CORS enabled (check backend logs)
- [ ] Browser console has no errors
- [ ] Test donation completes successfully
- [ ] Data appears in MongoDB

## 🚢 Production Deployment

1. **Deploy Backend** (Heroku/AWS/Azure)
   - Set environment variables
   - Note the URL

2. **Update Frontend config.js**
   ```javascript
   BACKEND_URL: 'https://api.yourdomain.com/api'
   ```

3. **Setup Razorpay Webhook**
   - URL: `https://api.yourdomain.com/api/webhook/razorpay`
   - Events: payment.captured, payment.failed

4. **Switch to Live Keys**
   - Get live keys from Razorpay
   - Update backend `.env`

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| CORS error | Update `FRONTEND_URL` in backend `.env` |
| Razorpay not defined | Check SDK loaded in `index.html` |
| 404 on API call | Verify backend URL in `config.js` |
| Signature verification failed | Check `RAZORPAY_KEY_SECRET` |
| MongoDB connection error | Verify `MONGODB_URI` |

## 📞 Need Help?

Check detailed guides:
- Backend: `backend/README.md`
- Integration: `INTEGRATION.md`
- Razorpay Docs: https://razorpay.com/docs/

## 🎯 What's Integrated

✅ Complete payment flow with Razorpay
✅ Order creation and verification
✅ Webhook for payment status updates
✅ MongoDB storage of all donation data
✅ 80G certificate tracking
✅ Maha Prasadam delivery tracking
✅ Security (rate limiting, validation, helmet)
✅ Cloud-ready (works on any platform)
