# Subhojanam Backend API

Backend service for Subhojanam hospital feeding donation platform with Razorpay payment integration and MongoDB storage.

## Tech Stack

- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database
- **Razorpay** - Payment gateway
- **Express Validator** - Input validation
- **Helmet** - Security headers
- **Rate Limiting** - API protection

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Setup
Create `.env` file in the backend directory:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/subhojanam
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
FRONTEND_URL=http://localhost:3000
```

### 3. Start MongoDB
**Local MongoDB:**
```bash
mongod --dbpath /path/to/data
```

**Or use MongoDB Atlas** (cloud):
Update `MONGODB_URI` in `.env` with your Atlas connection string.

### 4. Run Server
**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server runs at `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and timestamp.

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
  "occasion": "birthday",
  "sevaDate": "2026-03-01",
  "dateOfBirth": "1990-01-15",
  "wants80GCertificate": true,
  "wantsMahaPrasadam": false,
  "panNumber": "ABCDE1234F",
  "address": "123 Main St, City",
  "pincode": "500001",
  "wantsUpdates": true
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "order_xyz123",
  "amount": 50000,
  "currency": "INR",
  "donationId": "65abc123def456",
  "key": "rzp_test_xxxxx"
}
```

### Verify Payment
```
POST /api/donations/verify-payment
Content-Type: application/json

{
  "razorpay_order_id": "order_xyz123",
  "razorpay_payment_id": "pay_abc456",
  "razorpay_signature": "signature_hash"
}
```

### Get Donation Details
```
GET /api/donations/:id
```

### Get Statistics
```
GET /api/donations/stats/summary
```

Returns total donations, amount, and meals served.

### Razorpay Webhook
```
POST /api/webhook/razorpay
Content-Type: application/json
X-Razorpay-Signature: signature_hash
```

Handles payment events: `authorized`, `captured`, `failed`, `refunded`

## Testing the API

### Using cURL

**1. Test Health Check:**
```bash
curl http://localhost:5000/health
```

**2. Create Donation Order:**
```bash
curl -X POST http://localhost:5000/api/donations/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "donorName": "Test User",
    "donorEmail": "test@example.com",
    "donorPhone": "9876543210",
    "amount": 500,
    "donationType": "onetime"
  }'
```

**3. Get Statistics:**
```bash
curl http://localhost:5000/api/donations/stats/summary
```

### Using Postman

1. Import the collection (create endpoints manually or import from JSON)
2. Set base URL: `http://localhost:5000`
3. Test each endpoint with sample data

### Test Razorpay Integration

**Get Razorpay Test Credentials:**
1. Sign up at https://razorpay.com
2. Go to Settings → API Keys → Generate Test Key
3. Add to `.env` file

**Test Payment Flow:**
1. Create order via API
2. Use Razorpay test card: `4111 1111 1111 1111`, CVV: `123`, Expiry: Any future date
3. Payment will auto-succeed in test mode
4. Check webhook logs for event processing

## Database Schema

### Donation Model
```javascript
{
  donorName: String,
  donorEmail: String,
  donorPhone: String,
  amount: Number,
  donationType: "onetime" | "monthly",
  occasion: "general" | "birthday" | "anniversary" | "memory" | "other",
  sevaDate: Date,
  dateOfBirth: Date,
  wants80GCertificate: Boolean,
  wantsMahaPrasadam: Boolean,
  panNumber: String,
  address: String,
  pincode: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  paymentStatus: "created" | "pending" | "authorized" | "captured" | "failed" | "refunded",
  paymentMethod: String,
  capturedAt: Date,
  certificateGenerated: Boolean,
  prasadamDelivered: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend Integration

Add to frontend `script.js`:

```javascript
const BACKEND_URL = 'http://localhost:5000/api';

async function handleDonation(donationData) {
  try {
    // 1. Create order
    const response = await fetch(`${BACKEND_URL}/donations/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donationData)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      alert('Failed to create order');
      return;
    }
    
    // 2. Initialize Razorpay checkout
    const options = {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      order_id: data.orderId,
      name: 'Subhojanam',
      description: 'Hospital Feeding Donation',
      handler: async function (response) {
        // 3. Verify payment
        const verifyResponse = await fetch(`${BACKEND_URL}/donations/verify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response)
        });
        
        const result = await verifyResponse.json();
        
        if (result.success) {
          window.location.href = 'thankyou.html';
        }
      }
    };
    
    const razorpay = new Razorpay(options);
    razorpay.open();
    
  } catch (error) {
    console.error('Donation error:', error);
    alert('Something went wrong');
  }
}
```

## Deployment

### MongoDB Atlas Setup
1. Create account at https://cloud.mongodb.com
2. Create cluster (free tier available)
3. Get connection string
4. Update `MONGODB_URI` in production `.env`

### Cloud Deployment Options

**Heroku:**
```bash
heroku create subhojanam-api
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_uri
heroku config:set RAZORPAY_KEY_ID=your_key
git push heroku main
```

**AWS/Azure/GCP:**
- Use Node.js runtime
- Set environment variables
- Configure MongoDB connection
- Setup webhook URL in Razorpay dashboard

**Razorpay Webhook Configuration:**
1. Dashboard → Webhooks → Add New
2. URL: `https://yourdomain.com/api/webhook/razorpay`
3. Events: `payment.authorized`, `payment.captured`, `payment.failed`
4. Copy webhook secret to `.env`

## Security Notes

- Never commit `.env` file
- Use strong webhook secrets
- Enable HTTPS in production
- Validate all inputs
- Rate limit API endpoints
- Use helmet for security headers

## Troubleshooting

**MongoDB connection failed:**
- Check if MongoDB is running
- Verify connection string
- Check network access (Atlas)

**Razorpay payment not working:**
- Verify API keys are correct
- Check if using test mode keys
- Enable test mode in Razorpay dashboard

**Webhook not receiving events:**
- Verify webhook URL is accessible
- Check webhook secret matches
- Test with Razorpay webhook tester

## Support

For issues or questions, check:
- Razorpay docs: https://razorpay.com/docs/
- MongoDB docs: https://docs.mongodb.com/
- Express docs: https://expressjs.com/
