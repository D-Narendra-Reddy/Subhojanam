# 🔄 Recurring Payments Support - Implementation Guide

## ❌ Current Status

**The current implementation does NOT support actual recurring payments.**

What it does:
- ✅ Marks donation as "monthly" in database (`donationType: "monthly"`)
- ✅ Stores user's intent to donate monthly

What it does NOT do:
- ❌ Create automatic recurring charges
- ❌ Set up e-mandate for UPI autopay
- ❌ Auto-debit cards monthly
- ❌ Send recurring payment reminders

**It's a one-time payment that's tagged as "monthly" for your records.**

---

## ✅ How to Implement True Recurring Payments

To support actual monthly auto-payments (e-mandates, subscriptions), you need to use **Razorpay Subscriptions API** instead of the Orders API.

### Option 1: Razorpay Subscriptions (Recommended)

#### Features:
- ✅ Auto-charges every month
- ✅ Supports UPI autopay (e-mandates)
- ✅ Supports card autopay
- ✅ Supports bank autopay (eNACH)
- ✅ Automatic retry on failure
- ✅ Subscription management dashboard
- ✅ Pause/resume/cancel subscriptions
- ✅ Webhook notifications for subscription events

#### Requirements:
1. Subscription plan creation
2. Different API flow (subscriptions instead of orders)
3. Handle subscription webhooks
4. Additional database fields for subscription tracking

---

## 🚀 Implementation Steps for Recurring Payments

### Step 1: Update Backend Model

**Add to `models/Donation.js`:**

```javascript
// Add subscription fields
subscriptionId: {
  type: String,
  sparse: true
},
subscriptionStatus: {
  type: String,
  enum: ['created', 'active', 'paused', 'cancelled', 'expired', 'completed'],
  default: null
},
subscriptionPlanId: {
  type: String
},
nextBillingDate: {
  type: Date
},
totalCycles: {
  type: Number,
  default: null  // null = infinite
},
paidCycles: {
  type: Number,
  default: 0
},
subscriptionStartDate: {
  type: Date
},
subscriptionEndDate: {
  type: Date
}
```

### Step 2: Create Subscription Plan (One-time Setup)

**New file: `backend/scripts/createPlans.js`**

```javascript
const Razorpay = require('razorpay');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function createSubscriptionPlans() {
  // Create plans for different amounts
  const amounts = [500, 1000, 2500, 5000];
  
  for (const amount of amounts) {
    const plan = await razorpay.plans.create({
      period: 'monthly',
      interval: 1,
      item: {
        name: `Subhojanam Monthly - ₹${amount}`,
        description: `Monthly donation of ₹${amount} for hospital feeding`,
        amount: amount * 100, // in paise
        currency: 'INR'
      },
      notes: {
        type: 'monthly_donation'
      }
    });
    
    console.log(`Plan created for ₹${amount}: ${plan.id}`);
  }
}

createSubscriptionPlans();
```

Run once: `node backend/scripts/createPlans.js`

### Step 3: Add Subscription Routes

**New file: `backend/routes/subscription.js`**

```javascript
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Donation = require('../models/Donation');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Plan ID mapping (from createPlans.js output)
const PLAN_IDS = {
  500: process.env.PLAN_500,
  1000: process.env.PLAN_1000,
  2500: process.env.PLAN_2500,
  5000: process.env.PLAN_5000
};

// @route   POST /api/subscriptions/create
// @desc    Create Razorpay subscription for monthly donations
router.post('/create', async (req, res) => {
  try {
    const {
      donorName,
      donorEmail,
      donorPhone,
      amount,
      occasion,
      sevaDate,
      dateOfBirth,
      wants80GCertificate,
      wantsMahaPrasadam,
      panNumber,
      address,
      pincode,
      wantsUpdates
    } = req.body;

    // Get plan ID for this amount
    const planId = PLAN_IDS[amount];
    
    if (!planId) {
      return res.status(400).json({
        success: false,
        message: `No subscription plan available for ₹${amount}`
      });
    }

    // Create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: null, // infinite
      customer_notify: 1, // notify customer
      quantity: 1,
      notes: {
        donorName,
        donorEmail,
        donorPhone,
        occasion: occasion || 'general',
        panNumber: panNumber || 'Not provided',
        address: address || 'Not provided',
        pincode: pincode || 'Not provided',
        wants80GCertificate: wants80GCertificate || false,
        wantsMahaPrasadam: wantsMahaPrasadam || false
      }
    });

    // Create donation record
    const donation = new Donation({
      donorName,
      donorEmail,
      donorPhone,
      amount,
      donationType: 'monthly',
      occasion: occasion || 'general',
      sevaDate: sevaDate ? new Date(sevaDate) : undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      wants80GCertificate: wants80GCertificate || false,
      wantsMahaPrasadam: wantsMahaPrasadam || false,
      panNumber: panNumber || undefined,
      address: address || undefined,
      pincode: pincode || undefined,
      wantsUpdates: wantsUpdates !== false,
      subscriptionId: subscription.id,
      subscriptionPlanId: planId,
      subscriptionStatus: 'created',
      paymentStatus: 'created',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    await donation.save();

    res.status(201).json({
      success: true,
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url, // Razorpay hosted page
      donationId: donation._id,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: error.message
    });
  }
});

// @route   POST /api/subscriptions/cancel/:subscriptionId
// @desc    Cancel a subscription
router.post('/cancel/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    await razorpay.subscriptions.cancel(subscriptionId);
    
    await Donation.findOneAndUpdate(
      { subscriptionId },
      { subscriptionStatus: 'cancelled' }
    );

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message
    });
  }
});

module.exports = router;
```

### Step 4: Update Webhook Handler

**Add to `backend/routes/webhook.js`:**

```javascript
// Add new subscription event handlers
case 'subscription.activated':
  await handleSubscriptionActivated(payload);
  break;

case 'subscription.charged':
  await handleSubscriptionCharged(payload);
  break;

case 'subscription.paused':
  await handleSubscriptionPaused(payload);
  break;

case 'subscription.cancelled':
  await handleSubscriptionCancelled(payload);
  break;

case 'subscription.completed':
  await handleSubscriptionCompleted(payload);
  break;

// Handler functions
async function handleSubscriptionActivated(subscription) {
  await Donation.findOneAndUpdate(
    { subscriptionId: subscription.id },
    {
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date()
    }
  );
  console.log(`✅ Subscription activated: ${subscription.id}`);
}

async function handleSubscriptionCharged(payment) {
  const subscription = payment.subscription_id;
  
  // Create new donation record for this cycle
  const originalDonation = await Donation.findOne({ subscriptionId: subscription });
  
  if (originalDonation) {
    const newDonation = new Donation({
      ...originalDonation.toObject(),
      _id: undefined,
      razorpayPaymentId: payment.id,
      paymentStatus: 'captured',
      capturedAt: new Date(),
      paidCycles: originalDonation.paidCycles + 1
    });
    
    await newDonation.save();
    
    // Update original record
    await Donation.findOneAndUpdate(
      { subscriptionId: subscription },
      { $inc: { paidCycles: 1 } }
    );
    
    console.log(`✅ Subscription charged: ${subscription}, cycle: ${newDonation.paidCycles}`);
  }
}

async function handleSubscriptionPaused(subscription) {
  await Donation.findOneAndUpdate(
    { subscriptionId: subscription.id },
    { subscriptionStatus: 'paused' }
  );
  console.log(`⏸️ Subscription paused: ${subscription.id}`);
}

async function handleSubscriptionCancelled(subscription) {
  await Donation.findOneAndUpdate(
    { subscriptionId: subscription.id },
    {
      subscriptionStatus: 'cancelled',
      subscriptionEndDate: new Date()
    }
  );
  console.log(`❌ Subscription cancelled: ${subscription.id}`);
}

async function handleSubscriptionCompleted(subscription) {
  await Donation.findOneAndUpdate(
    { subscriptionId: subscription.id },
    {
      subscriptionStatus: 'completed',
      subscriptionEndDate: new Date()
    }
  );
  console.log(`✅ Subscription completed: ${subscription.id}`);
}
```

### Step 5: Update Frontend

**Modify `frontend/script.js`:**

```javascript
// In form submission handler, check donationType
if (donationData.donationType === 'monthly') {
  // Create subscription instead of order
  const response = await fetch(getApiEndpoint('/subscriptions/create'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(donationData)
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Redirect to Razorpay hosted subscription page
    window.location.href = data.shortUrl;
  }
} else {
  // Existing one-time payment flow
  // ... existing code ...
}
```

### Step 6: Update Environment Variables

**Add to `.env`:**

```env
# Subscription Plan IDs (from createPlans.js output)
PLAN_500=plan_xxxxxxxxxxxxx
PLAN_1000=plan_xxxxxxxxxxxxx
PLAN_2500=plan_xxxxxxxxxxxxx
PLAN_5000=plan_xxxxxxxxxxxxx
```

### Step 7: Register Subscription Routes

**Update `backend/server.js`:**

```javascript
app.use('/api/subscriptions', require('./routes/subscription'));
```

---

## 🎯 Features After Implementation

### For One-Time Donations:
- Existing flow continues as-is
- Single payment via Razorpay checkout

### For Monthly Donations:
- ✅ Auto-charges every month
- ✅ E-mandate support (UPI autopay, card autopay, eNACH)
- ✅ User authenticates once, auto-charged thereafter
- ✅ Razorpay handles retry logic for failed payments
- ✅ User receives payment reminders
- ✅ Can pause/resume/cancel anytime
- ✅ Each monthly charge creates new donation record
- ✅ Complete subscription history in your database

---

## 📊 E-Mandate Process

When user selects monthly donation:

```
1. User fills form and selects "Monthly Donation"
   ↓
2. Backend creates Razorpay subscription
   ↓
3. User redirected to Razorpay subscription page
   ↓
4. User selects payment method:
   - UPI Autopay (e-mandate)
   - Card Autopay
   - eNACH (bank autopay)
   ↓
5. User authenticates mandate (one-time)
   ↓
6. First payment collected immediately
   ↓
7. Subscription activated
   ↓
8. Auto-charged on same date every month
   ↓
9. Webhook notifies your server on each charge
   ↓
10. New donation record created each month
```

---

## 💰 Pricing & Limits

### Razorpay Subscription Fees:
- **Transaction fee:** 2% + ₹2 per transaction
- **No setup fee**
- **No monthly fee**

### E-Mandate Limits:
- **UPI Autopay:** Up to ₹15,000 per transaction
- **Card Autopay:** No limit
- **eNACH:** ₹1,00,000 per transaction

---

## 🧪 Testing Recurring Payments

### Test Mode:
1. Create subscription with test keys
2. Use test payment methods
3. Subscriptions auto-charge every minute (test mode fast-forward)
4. Check webhook events
5. Verify donation records created

### Test Payment Methods:
- **UPI:** Any UPI ID in test mode
- **Card:** 5104 0600 0000 0008, CVV: 123
- **NetBanking:** Select any bank in test mode

---

## 📋 Database Records

### Original Subscription Record:
```javascript
{
  subscriptionId: "sub_xyz123",
  subscriptionStatus: "active",
  subscriptionPlanId: "plan_500",
  amount: 500,
  donationType: "monthly",
  paidCycles: 5,  // Updated each month
  subscriptionStartDate: "2026-02-17",
  nextBillingDate: "2026-03-17"
}
```

### Each Monthly Charge Creates New Record:
```javascript
{
  subscriptionId: "sub_xyz123",  // Links to original
  razorpayPaymentId: "pay_abc456",
  amount: 500,
  paymentStatus: "captured",
  capturedAt: "2026-03-17",
  paidCycles: 1  // Which cycle this payment is for
}
```

---

## ⚠️ Important Notes

1. **Different API Flow**: Subscriptions use different endpoints than orders
2. **Authentication**: First payment requires authentication for e-mandate
3. **Webhook Setup**: Must handle subscription.* events in webhook
4. **Plan Creation**: Create plans before accepting subscriptions
5. **Cancellation**: Provide UI for users to cancel subscriptions
6. **Retries**: Razorpay handles failed payment retries automatically
7. **Notifications**: Razorpay sends SMS/email to users for charges

---

## 🚀 Quick Implementation

**Want me to implement this?** I can:

1. ✅ Add subscription model fields
2. ✅ Create subscription routes
3. ✅ Update webhook handlers
4. ✅ Modify frontend to handle both flows
5. ✅ Add plan creation script
6. ✅ Update documentation

Let me know if you want the full recurring payment implementation!

---

## 📞 Alternative: Manual Reminders

If you don't want full automation, simpler approach:

1. Keep current implementation
2. Store "monthly" flag in database
3. Send email/SMS reminders monthly
4. User manually donates each month
5. Track their monthly donation history

**Trade-off:** Not truly recurring, but simpler to implement.

---

## Summary

| Feature | Current | With Subscriptions |
|---------|---------|-------------------|
| One-time payment | ✅ Works | ✅ Works |
| Monthly flag in DB | ✅ Stored | ✅ Stored |
| Auto-recurring charge | ❌ No | ✅ Yes |
| E-mandate support | ❌ No | ✅ Yes |
| Auto-retry failed | ❌ No | ✅ Yes |
| User cancellation | ❌ N/A | ✅ Yes |
| Implementation | ✅ Done | ⚠️ Needs work |

**Need recurring payments? Let me implement it!** 🚀
