# 🍛 Subhojanam - Hospital Feeding Donation Platform

Complete donation platform for ISKCON Visakhapatnam's hospital feeding program with Razorpay payment integration and MongoDB storage.

## 📁 Project Structure

```
Subhojanam/
├── frontend/              # React-free vanilla JS frontend
│   ├── index.html         # Main donation page
│   ├── script.js          # UI logic + Razorpay integration
│   ├── config.js          # Backend API configuration
│   ├── styles.css         # Complete styling
│   ├── test-api.html      # API testing tool
│   ├── thankyou.html      # Success page
│   └── assests/           # Images and assets
│
├── backend/               # Node.js + Express API
│   ├── server.js          # Main Express app
│   ├── config/
│   │   └── db.js          # MongoDB connection
│   ├── models/
│   │   └── Donation.js    # Mongoose schema
│   ├── routes/
│   │   ├── donation.js    # Donation APIs
│   │   └── webhook.js     # Razorpay webhooks
│   ├── package.json       # Dependencies
│   ├── .env.example       # Environment template
│   └── README.md          # Backend docs
│
├── QUICKSTART.md          # 5-minute setup guide
├── INTEGRATION.md         # Detailed integration docs
├── FRONTEND_CHANGES.md    # Summary of frontend changes
└── README.md              # This file
```

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 16+ installed
- MongoDB running (local or Atlas)
- Razorpay test account

### 1. Clone & Setup Backend
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your MongoDB URI and Razorpay keys

# Start server
npm run dev
```
Backend runs at `http://localhost:5000`

### 2. Setup Frontend
```bash
# Navigate to frontend
cd frontend

# Edit config.js to point to backend
# Default: http://localhost:5000/api

# Serve frontend (choose one):
python3 -m http.server 3000
# OR use VS Code Live Server
```
Frontend runs at `http://localhost:3000`

### 3. Test
1. Open `http://localhost:3000`
2. Click "Donate Now" → Select ₹500
3. Fill form → "Proceed to Pay"
4. Test card: **4111 1111 1111 1111**, CVV: 123
5. Complete payment
6. Check MongoDB: `db.donations.find()`

## 🎯 Features

### Frontend
- ✅ Beautiful, responsive donation UI
- ✅ Multiple donation amounts (₹500, ₹1000, ₹2500, ₹5000)
- ✅ Custom amount input
- ✅ One-time and monthly donation options
- ✅ Special occasions (Birthday, Anniversary, Memory)
- ✅ 80G tax certificate request
- ✅ Maha Prasadam delivery request
- ✅ Real-time Razorpay payment integration
- ✅ Payment verification
- ✅ Success/failure handling

### Backend
- ✅ Express.js REST API
- ✅ MongoDB with Mongoose ODM
- ✅ Razorpay order creation
- ✅ Payment signature verification
- ✅ Webhook handling (authorized, captured, failed, refunded)
- ✅ Complete donation data storage
- ✅ Statistics API
- ✅ Security (Helmet, rate limiting, input validation)
- ✅ CORS configured
- ✅ Cloud-ready (works on any platform)

## 📊 Data Collected

Each donation captures:
- **Donor Info:** Name, email, phone
- **Donation:** Amount, type (onetime/monthly), occasion
- **Special Dates:** Seva date, date of birth
- **Preferences:** 80G certificate, Maha Prasadam
- **Tax Info:** PAN number (if 80G requested)
- **Delivery:** Address, pincode (if Prasadam requested)
- **Payment:** Razorpay order ID, payment ID, status, method, bank
- **Tracking:** Payment status, certificate status, delivery status
- **Metadata:** IP address, user agent, timestamps

## 🔌 API Endpoints

### Health Check
```
GET /health
```

### Create Donation Order
```
POST /api/donations/create-order
Content-Type: application/json

{
  "donorName": "John Doe",
  "donorEmail": "john@example.com",
  "donorPhone": "9876543210",
  "amount": 500,
  "donationType": "onetime",
  "occasion": "birthday"
}
```

### Verify Payment
```
POST /api/donations/verify-payment

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

### Get Donation Stats
```
GET /api/donations/stats/summary
```

### Razorpay Webhook
```
POST /api/webhook/razorpay
X-Razorpay-Signature: signature
```

## 🧪 Testing

### Quick API Test
Open `http://localhost:3000/test-api.html` - Visual testing tool with:
- Health check
- Create order
- Get statistics
- Full payment flow

### Manual Testing
```bash
# Test health
curl http://localhost:5000/health

# Test create order
curl -X POST http://localhost:5000/api/donations/create-order \
  -H "Content-Type: application/json" \
  -d '{"donorName":"Test","donorEmail":"test@test.com","donorPhone":"9876543210","amount":500}'

# Test stats
curl http://localhost:5000/api/donations/stats/summary
```

## 🔐 Environment Configuration

### Backend `.env`
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/subhojanam
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxx
FRONTEND_URL=http://localhost:3000
API_RATE_LIMIT=100
```

### Frontend `config.js`
```javascript
const API_CONFIG = {
    BACKEND_URL: 'http://localhost:5000/api'
};
```

## 🚢 Production Deployment

### Step 1: Deploy Backend
Choose your platform:
- **Heroku:** `heroku create && git push heroku main`
- **AWS/Azure/GCP:** Use Node.js runtime
- **Vercel/Railway:** Connect GitHub repo

Set environment variables in platform dashboard.

### Step 2: Update Frontend Config
```javascript
const API_CONFIG = {
    BACKEND_URL: 'https://api.yourdomain.com/api'
};
```

### Step 3: Configure Razorpay
1. Switch to **Live Mode** in Razorpay dashboard
2. Generate **Live API Keys**
3. Setup **Webhook:**
   - URL: `https://api.yourdomain.com/api/webhook/razorpay`
   - Events: payment.authorized, payment.captured, payment.failed
4. Copy webhook secret
5. Update backend `.env` with live keys

### Step 4: Deploy Frontend
- **Netlify/Vercel:** Drag & drop frontend folder
- **GitHub Pages:** Push to gh-pages branch
- **S3/Azure Blob:** Upload static files

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get running in 5 minutes
- **[INTEGRATION.md](INTEGRATION.md)** - Detailed integration guide
- **[FRONTEND_CHANGES.md](FRONTEND_CHANGES.md)** - Summary of frontend changes
- **[backend/README.md](backend/README.md)** - Backend API documentation

## 🔒 Security

- ✅ Payment signature verification
- ✅ Webhook signature verification
- ✅ Input validation with express-validator
- ✅ Rate limiting (100 requests/15 min)
- ✅ Helmet security headers
- ✅ CORS configured
- ✅ No secrets in frontend code
- ✅ HTTPS enforced in production

## 🛠️ Tech Stack

**Frontend:**
- Vanilla JavaScript (no frameworks)
- Razorpay Checkout SDK
- HTML5 + CSS3
- Responsive design

**Backend:**
- Node.js
- Express.js
- MongoDB + Mongoose
- Razorpay Node SDK
- Express Validator
- Helmet + Rate Limiting

## 📈 Future Enhancements

- [ ] Email notifications (80G certificate, thank you)
- [ ] SMS notifications
- [ ] Admin dashboard
- [ ] Donor portal
- [ ] Receipt generation
- [ ] Recurring payments (subscriptions)
- [ ] WhatsApp integration
- [ ] Analytics dashboard

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS error | Update `FRONTEND_URL` in backend `.env` |
| Razorpay not defined | Check SDK loaded in HTML |
| API 404 | Verify backend URL in `config.js` |
| Payment verification failed | Check `RAZORPAY_KEY_SECRET` |
| MongoDB connection error | Verify `MONGODB_URI` |
| Webhook not working | Use ngrok for local testing |

## 📞 Support

**Issues with:**
- Backend setup: See `backend/README.md`
- Integration: See `INTEGRATION.md`
- Quick fixes: See `QUICKSTART.md`
- Razorpay: https://razorpay.com/docs/

## 📝 License

MIT License - Free to use for charitable purposes

## 🙏 Credits

Built for ISKCON Visakhapatnam's Subhojanam hospital feeding program.

---

**🎯 Ready to serve meals? Follow the [QUICKSTART.md](QUICKSTART.md) guide!**
