# Frontend Integration Guide

## Changes Made to Frontend

### 1. Files Added
- **`config.js`** - Backend API configuration file

### 2. Files Modified
- **`index.html`** - Added Razorpay SDK and config.js script
- **`script.js`** - Replaced simulated payment with real Razorpay integration

## Detailed Changes

### index.html
Added Razorpay Checkout SDK before closing `</body>` tag:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script src="config.js"></script>
<script src="script.js"></script>
```

### config.js (New File)
Central configuration for backend API URL:
```javascript
const API_CONFIG = {
    BACKEND_URL: 'http://localhost:5000/api',
};
```

**For Production:** Update `BACKEND_URL` to your deployed backend URL.

### script.js
**Old Flow (Lines 264-340):**
- Simulated payment with setTimeout
- Redirected directly to thank you page

**New Flow:**
1. Validates form data
2. Calls backend `/api/donations/create-order` to create Razorpay order
3. Opens Razorpay checkout modal with order details
4. On payment success, calls `/api/donations/verify-payment` 
5. Redirects to thank you page with payment ID

**Key Changes:**
- Changed function to `async` (line 265)
- Added fetch calls to backend API (lines 281-288)
- Integrated Razorpay SDK (lines 293-329)
- Added payment verification handler (lines 313-326)
- Better error handling with try-catch

## Testing the Integration

### 1. Start Backend Server
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

Backend runs at `http://localhost:5000`

### 2. Serve Frontend
**Option A: Using Python**
```bash
cd frontend
python3 -m http.server 3000
```

**Option B: Using Node.js (http-server)**
```bash
npm install -g http-server
cd frontend
http-server -p 3000
```

**Option C: Using VS Code Live Server**
- Install "Live Server" extension
- Right-click `index.html` → Open with Live Server

Frontend runs at `http://localhost:3000`

### 3. Update CORS in Backend
Ensure backend `.env` has:
```env
FRONTEND_URL=http://localhost:3000
```

### 4. Get Razorpay Test Credentials
1. Sign up at https://razorpay.com
2. Go to **Settings → API Keys → Generate Test Key**
3. Copy **Key ID** and **Key Secret**
4. Add to backend `.env`:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key
```

### 5. Test Payment Flow
1. Open `http://localhost:3000` in browser
2. Click "Donate Now"
3. Select amount (e.g., ₹500)
4. Fill donor details in modal
5. Click "Proceed to Pay"
6. Razorpay checkout opens
7. Use test card:
   - **Card Number:** 4111 1111 1111 1111
   - **CVV:** 123
   - **Expiry:** Any future date
   - **Name:** Test User
8. Complete payment
9. Verify you're redirected to thank you page

### 6. Verify Data in MongoDB
```bash
# Connect to MongoDB
mongosh

# Switch to database
use subhojanam

# View donations
db.donations.find().pretty()
```

## Production Deployment

### 1. Deploy Backend
Deploy to Heroku/AWS/Azure/GCP and get the URL (e.g., `https://api.subhojanam.com`)

### 2. Update Frontend Config
Edit `frontend/config.js`:
```javascript
const API_CONFIG = {
    BACKEND_URL: 'https://api.subhojanam.com/api',
};
```

### 3. Update Backend CORS
In backend `.env`:
```env
FRONTEND_URL=https://subhojanam.com
```

### 4. Setup Razorpay Webhook
1. Go to Razorpay Dashboard → **Webhooks**
2. Add webhook URL: `https://api.subhojanam.com/api/webhook/razorpay`
3. Select events:
   - payment.authorized
   - payment.captured
   - payment.failed
   - refund.created
4. Copy **Webhook Secret**
5. Add to backend `.env`:
```env
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 5. Switch to Live Mode
1. Generate **Live API Keys** from Razorpay
2. Update backend `.env` with live keys
3. Update `NODE_ENV=production`

## Data Flow

```
User → Frontend → Backend → Razorpay → Backend → MongoDB
  ↓                           ↓
Thank You Page ← Verify ← Payment Success
```

**Step-by-Step:**
1. User fills donation form
2. Frontend sends data to `POST /api/donations/create-order`
3. Backend creates Razorpay order and saves to MongoDB (status: "created")
4. Backend returns order details to frontend
5. Frontend opens Razorpay checkout
6. User completes payment on Razorpay
7. Razorpay sends payment response to frontend
8. Frontend sends to `POST /api/donations/verify-payment`
9. Backend verifies signature and updates MongoDB (status: "captured")
10. Razorpay webhook also sends event to backend (redundant verification)
11. Frontend redirects to thank you page

## Environment Variables Summary

### Backend (.env)
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

### Frontend (config.js)
```javascript
BACKEND_URL: 'http://localhost:5000/api'
```

## Troubleshooting

### CORS Error
**Error:** `Access-Control-Allow-Origin`
**Fix:** Update `FRONTEND_URL` in backend `.env` to match your frontend URL

### Razorpay Not Loaded
**Error:** `Razorpay is not defined`
**Fix:** Ensure `checkout.js` script is loaded before `script.js`

### API 404 Error
**Error:** `Cannot POST /api/donations/create-order`
**Fix:** Verify backend is running and `BACKEND_URL` in `config.js` is correct

### Payment Verification Failed
**Error:** `Invalid payment signature`
**Fix:** Ensure `RAZORPAY_KEY_SECRET` in backend `.env` is correct

### Webhook Not Working
**Fix:** 
- Ensure webhook URL is publicly accessible (use ngrok for local testing)
- Verify webhook secret matches
- Check webhook logs in Razorpay dashboard

## Testing with ngrok (Local Webhook Testing)

1. Install ngrok: https://ngrok.com/download
2. Start backend: `npm run dev`
3. In new terminal: `ngrok http 5000`
4. Copy ngrok URL (e.g., `https://abc123.ngrok.io`)
5. Add to Razorpay webhook: `https://abc123.ngrok.io/api/webhook/razorpay`
6. Test payment and watch terminal for webhook events

## Security Checklist

- ✅ Never expose Razorpay secret key in frontend
- ✅ Always verify payment signature on backend
- ✅ Use HTTPS in production
- ✅ Enable rate limiting on API
- ✅ Validate all user inputs
- ✅ Never commit `.env` file
- ✅ Use webhook secret for webhook verification
- ✅ Log all transactions for auditing

## Support

For integration issues:
1. Check browser console for errors
2. Check backend terminal logs
3. Verify all environment variables
4. Test with Razorpay test mode first
5. Refer to Razorpay docs: https://razorpay.com/docs/
