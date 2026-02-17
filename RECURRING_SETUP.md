# ✅ Recurring Payments Implementation - Complete

## 🎉 What's Been Added

Full support for monthly recurring donations with e-mandates (UPI autopay, card autopay, eNACH)!

### Files Modified:
1. ✅ `backend/models/Donation.js` - Added subscription fields
2. ✅ `backend/routes/webhook.js` - Added 8 subscription event handlers
3. ✅ `backend/server.js` - Registered subscription routes
4. ✅ `backend/.env.example` - Added plan ID placeholders
5. ✅ `frontend/script.js` - Added subscription flow logic

### Files Created:
6. ✅ `backend/routes/subscription.js` - Complete subscription API
7. ✅ `backend/scripts/createPlans.js` - Plan creation script

---

## 🚀 Setup Instructions (Step-by-Step)

### Step 1: Create Subscription Plans (One-Time Setup)

Run this script to create plans in Razorpay:

```bash
cd backend
node scripts/createPlans.js
```

**Output will look like:**
```
✅ Plan created for ₹500:
   Plan ID: plan_xxxxxxxxxxxxx

✅ Plan created for ₹1000:
   Plan ID: plan_xxxxxxxxxxxxx

✅ Plan created for ₹2500:
   Plan ID: plan_xxxxxxxxxxxxx

✅ Plan created for ₹5000:
   Plan ID: plan_xxxxxxxxxxxxx

📋 Add these to your .env file:
PLAN_500=plan_xxxxxxxxxxxxx
PLAN_1000=plan_xxxxxxxxxxxxx
PLAN_2500=plan_xxxxxxxxxxxxx
PLAN_5000=plan_xxxxxxxxxxxxx
```

### Step 2: Update .env File

Copy the plan IDs from the output and add to your `.env`:

```env
# Razorpay Subscription Plan IDs
PLAN_500=plan_xxxxxxxxxxxxx
PLAN_1000=plan_xxxxxxxxxxxxx
PLAN_2500=plan_xxxxxxxxxxxxx
PLAN_5000=plan_xxxxxxxxxxxxx
```

### Step 3: Restart Backend

```bash
npm run dev
```

### Step 4: Configure Webhook Events

Add these subscription events in Razorpay Dashboard:

1. Go to **Razorpay Dashboard → Settings → Webhooks**
2. Add your webhook URL: `https://yourdomain.com/api/webhook/razorpay`
3. Select these events:
   - ✅ `subscription.authenticated`
   - ✅ `subscription.activated`
   - ✅ `subscription.charged`
   - ✅ `subscription.paused`
   - ✅ `subscription.resumed`
   - ✅ `subscription.cancelled`
   - ✅ `subscription.completed`
   - ✅ `subscription.halted`

### Step 5: Test!

1. Open frontend: `http://localhost:3000`
2. Click "Donate Now"
3. Select **"Monthly Donation"** toggle
4. Select amount (₹500, ₹1000, ₹2500, or ₹5000)
5. Fill form → "Proceed to Pay"
6. You'll be redirected to Razorpay subscription page
7. Authenticate e-mandate (UPI/Card/Bank)
8. First payment collected immediately
9. Auto-charged monthly thereafter!

---

## 🎯 How It Works

### One-Time Donation Flow (Existing):
```
User selects "One-time" → Creates order → Razorpay checkout → 
Payment captured → Thank you page
```

### Monthly Donation Flow (NEW):
```
User selects "Monthly" → Creates subscription → Redirects to Razorpay →
User authenticates e-mandate → First payment captured →
Subscription activated → Auto-charged monthly →
Webhook creates new donation record each month
```

---

## 📊 Database Schema Updates

### New Subscription Fields Added to Donation Model:

```javascript
{
  // ... existing fields ...
  
  // Subscription Fields (NEW)
  subscriptionId: String,              // Razorpay subscription ID
  subscriptionStatus: String,          // created/active/paused/cancelled/completed
  subscriptionPlanId: String,          // Which plan (500/1000/2500/5000)
  nextBillingDate: Date,               // When next charge
  totalCycles: Number,                 // null = infinite
  paidCycles: Number,                  // How many months paid
  subscriptionStartDate: Date,         // When started
  subscriptionEndDate: Date,           // When ended/cancelled
  parentSubscriptionId: String         // Links monthly charges to original
}
```

### Example Records:

**Original Subscription Record:**
```javascript
{
  _id: "abc123",
  subscriptionId: "sub_xyz789",
  subscriptionStatus: "active",
  amount: 500,
  donationType: "monthly",
  paidCycles: 3,
  subscriptionStartDate: "2026-02-17",
  nextBillingDate: "2026-03-17"
}
```

**Each Monthly Charge Creates New Record:**
```javascript
{
  _id: "def456",
  parentSubscriptionId: "sub_xyz789",  // Links to original
  razorpayPaymentId: "pay_month2",
  amount: 500,
  paymentStatus: "captured",
  paidCycles: 2,  // 2nd month payment
  capturedAt: "2026-03-17"
}
```

---

## 🔌 New API Endpoints

### Create Subscription
```bash
POST /api/subscriptions/create
{
  "donorName": "John Doe",
  "donorEmail": "john@example.com",
  "donorPhone": "9876543210",
  "amount": 500,
  "occasion": "birthday"
}

Response:
{
  "success": true,
  "subscriptionId": "sub_xyz789",
  "shortUrl": "https://rzp.io/s/abc123",  # Redirect user here
  "donationId": "65abc...",
  "key": "rzp_test_xxxxx"
}
```

### Get Subscription
```bash
GET /api/subscriptions/:subscriptionId

Response:
{
  "success": true,
  "subscription": { /* Razorpay data */ },
  "donation": { /* DB record */ }
}
```

### Cancel Subscription
```bash
POST /api/subscriptions/cancel/:subscriptionId
{
  "cancelAtCycleEnd": false  # true = cancel at end of current cycle
}
```

### Pause Subscription
```bash
POST /api/subscriptions/pause/:subscriptionId
```

### Resume Subscription
```bash
POST /api/subscriptions/resume/:subscriptionId
```

---

## 🔔 Webhook Events Handled

| Event | Action |
|-------|--------|
| `subscription.authenticated` | User completed authentication |
| `subscription.activated` | First payment successful, subscription active |
| `subscription.charged` | Monthly payment captured (creates new donation record) |
| `subscription.paused` | User paused subscription |
| `subscription.resumed` | User resumed subscription |
| `subscription.cancelled` | User cancelled subscription |
| `subscription.completed` | Subscription finished (if limited cycles) |
| `subscription.halted` | Subscription halted due to payment failures |

---

## 💳 E-Mandate Payment Methods

### Supported:

1. **UPI Autopay** (e-mandate)
   - Limit: ₹15,000 per transaction
   - Best for: Most users
   - Authentication: UPI PIN one-time
   - Auto-charges: Monthly without OTP

2. **Card Autopay**
   - Limit: No limit
   - Best for: Higher amounts
   - Authentication: Card details + OTP one-time
   - Auto-charges: Monthly without OTP

3. **eNACH (Bank Autopay)**
   - Limit: ₹1,00,000 per transaction
   - Best for: Large donors
   - Authentication: Netbanking one-time
   - Auto-charges: Monthly automatically

---

## 🧪 Testing Recurring Payments

### Test Mode Fast-Forward

In Razorpay test mode:
- Subscriptions charge **every minute** instead of monthly
- Perfect for testing without waiting 30 days!

### Test Flow:

1. Create subscription with test keys
2. Use test payment method:
   - **UPI:** Any UPI ID works
   - **Card:** 5104 0600 0000 0008, CVV: 123
   - **NetBanking:** Any bank in dropdown
3. Wait 1-2 minutes (test mode)
4. Check webhook logs - should see `subscription.charged` event
5. Check database - new donation record created
6. Repeat every minute

### Monitor Logs:

```bash
# Backend terminal will show:
✅ Subscription activated: sub_xyz789
✅ Subscription charged: sub_xyz789, cycle: 2
✅ Subscription charged: sub_xyz789, cycle: 3
```

---

## 📱 User Experience

### Monthly Donation Journey:

1. **User selects "Monthly Donation"** on your site
2. **Fills donation form** (name, email, amount, etc.)
3. **Clicks "Proceed to Pay"**
4. **Redirected to Razorpay subscription page**
5. **Selects payment method** (UPI/Card/Bank)
6. **Authenticates e-mandate** (one-time authentication)
7. **First payment collected** immediately
8. **Subscription activated** - sees confirmation
9. **Auto-charged monthly** - no further action needed
10. **Receives SMS/email** before each charge
11. **Can manage subscription** - pause/resume/cancel anytime

### User Notifications (Auto-sent by Razorpay):

- ✉️ Subscription activation confirmation
- ✉️ Reminder before each monthly charge
- ✉️ Payment success confirmation (monthly)
- ✉️ Payment failure alert (if any)
- ✉️ Subscription cancellation confirmation

---

## 🎯 Production Checklist

### Before Going Live:

- [ ] Run `node scripts/createPlans.js` with **test keys**
- [ ] Test subscription flow end-to-end
- [ ] Verify webhook events are received
- [ ] Check donation records created monthly
- [ ] Test pause/resume/cancel
- [ ] Switch to **live Razorpay keys**
- [ ] Run `node scripts/createPlans.js` with **live keys**
- [ ] Update `.env` with live plan IDs
- [ ] Configure webhook with production URL
- [ ] Enable all subscription events in webhook
- [ ] Test one live subscription (₹1)
- [ ] Monitor for first month
- [ ] Add user notification emails (TODO)
- [ ] Add subscription management UI (TODO)

---

## 🔐 Security Notes

1. **Plan IDs are safe to expose** - they're just references
2. **Subscription authentication** - User must authenticate e-mandate
3. **Webhook verification** - All events verified with signature
4. **No card storage** - Razorpay handles securely
5. **PCI DSS compliant** - Industry standard security

---

## 💰 Pricing

**Razorpay Subscription Fees:**
- 2% + ₹2 per transaction
- No setup fee
- No monthly fee
- No platform fee

**Example:**
- ₹500 monthly donation
- Fee: ₹500 × 2% + ₹2 = ₹12
- You receive: ₹488

---

## 🎨 Frontend Changes

### Payment Flow Decision:

```javascript
// In script.js form submission
if (isMonthly) {
  // Create subscription → Redirect to Razorpay
  const response = await fetch('/api/subscriptions/create', ...);
  window.location.href = response.shortUrl;
} else {
  // Create order → Open Razorpay checkout (existing flow)
  const response = await fetch('/api/donations/create-order', ...);
  razorpay.open();
}
```

Users see **same form**, backend handles routing automatically!

---

## 📊 Monitoring Subscriptions

### View Active Subscriptions:

```bash
# MongoDB query
db.donations.find({
  subscriptionStatus: "active",
  donationType: "monthly"
}).pretty()
```

### View Monthly Charges:

```bash
# All charges for a subscription
db.donations.find({
  parentSubscriptionId: "sub_xyz789"
}).sort({ createdAt: -1 })
```

### Get Subscription Statistics:

```bash
GET /api/donations/stats/summary

# Add this to donation.js:
const activeSubscriptions = await Donation.countDocuments({
  subscriptionStatus: 'active'
});

const monthlyRevenue = await Donation.aggregate([
  { $match: { subscriptionStatus: 'active' } },
  { $group: { _id: null, total: { $sum: '$amount' } } }
]);
```

---

## 🚀 Next Steps (Optional Enhancements)

### User Subscription Portal:
- [ ] View subscription status
- [ ] Update payment method
- [ ] Pause/resume subscription
- [ ] View payment history
- [ ] Download receipts

### Admin Dashboard:
- [ ] View all active subscriptions
- [ ] Monitor subscription health
- [ ] Track churn rate
- [ ] Generate revenue reports
- [ ] Export subscription data

### Notifications:
- [ ] Email on subscription activation
- [ ] Email before monthly charge
- [ ] Email on payment success
- [ ] Email on payment failure
- [ ] SMS reminders

---

## ✅ Summary

**✨ FULLY IMPLEMENTED:**
- ✅ Subscription creation API
- ✅ Subscription management (pause/resume/cancel)
- ✅ Webhook handlers for all subscription events
- ✅ Database schema with subscription tracking
- ✅ Frontend routing (one-time vs monthly)
- ✅ Plan creation script
- ✅ E-mandate support (UPI/Card/Bank autopay)
- ✅ Monthly charge tracking
- ✅ Complete documentation

**🎯 READY TO USE:**
1. Run `node scripts/createPlans.js`
2. Copy plan IDs to `.env`
3. Restart backend
4. Test monthly donation
5. Deploy to production!

**📞 Support:**
- See: `RECURRING_PAYMENTS.md` for detailed guide
- Razorpay Docs: https://razorpay.com/docs/payments/subscriptions/

**You now have full recurring payment support with e-mandates! 🎉**
