const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Donation = require('../models/Donation');

// @route   POST /api/webhook/razorpay
// @desc    Handle Razorpay webhook events
// @access  Public (but validated with webhook secret)
router.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Get webhook signature from headers
    const webhookSignature = req.headers['x-razorpay-signature'];

    if (!webhookSignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing webhook signature'
      });
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const body = req.body.toString();
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    // Parse the event
    const event = JSON.parse(body);
    const eventType = event.event;
    const payload = event.payload.payment ? event.payload.payment.entity : event.payload.order.entity;

    console.log(`📥 Webhook received: ${eventType}`);

    // Handle different event types
    switch (eventType) {
      case 'payment.authorized':
        await handlePaymentAuthorized(payload);
        break;

      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;

      case 'order.paid':
        await handleOrderPaid(payload);
        break;

      case 'refund.created':
        await handleRefundCreated(payload);
        break;

      // Subscription events
      case 'subscription.authenticated':
        await handleSubscriptionAuthenticated(payload);
        break;

      case 'subscription.activated':
        await handleSubscriptionActivated(payload);
        break;

      case 'subscription.charged':
        await handleSubscriptionCharged(payload);
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(payload);
        break;

      case 'subscription.resumed':
        await handleSubscriptionResumed(payload);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;

      case 'subscription.completed':
        await handleSubscriptionCompleted(payload);
        break;

      case 'subscription.halted':
        await handleSubscriptionHalted(payload);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    res.status(200).json({ success: true, received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
});

// Handler: Payment Authorized
async function handlePaymentAuthorized(payment) {
  try {
    const donation = await Donation.findOneAndUpdate(
      { razorpayOrderId: payment.order_id },
      {
        razorpayPaymentId: payment.id,
        paymentStatus: 'authorized',
        paymentMethod: payment.method,
        paymentBank: payment.bank || undefined,
        paymentWallet: payment.wallet || undefined,
        paymentVpa: payment.vpa || undefined,
        paymentCardId: payment.card_id || undefined,
        authorizedAt: new Date(payment.created_at * 1000)
      },
      { new: true }
    );

    if (donation) {
      console.log(`✅ Payment authorized for donation: ${donation._id}`);
    }
  } catch (error) {
    console.error('Error handling payment.authorized:', error);
  }
}

// Handler: Payment Captured
async function handlePaymentCaptured(payment) {
  try {
    const donation = await Donation.findOneAndUpdate(
      { razorpayOrderId: payment.order_id },
      {
        razorpayPaymentId: payment.id,
        paymentStatus: 'captured',
        paymentMethod: payment.method,
        paymentBank: payment.bank || undefined,
        paymentWallet: payment.wallet || undefined,
        paymentVpa: payment.vpa || undefined,
        paymentCardId: payment.card_id || undefined,
        capturedAt: new Date()
      },
      { new: true }
    );

    if (donation) {
      console.log(`✅ Payment captured for donation: ${donation._id}`);
      
      // TODO: Trigger post-capture actions
      // - Send 80G certificate email if requested
      // - Initiate prasadam delivery if requested
      // - Send thank you email
      // - Update WhatsApp group
    }
  } catch (error) {
    console.error('Error handling payment.captured:', error);
  }
}

// Handler: Payment Failed
async function handlePaymentFailed(payment) {
  try {
    const donation = await Donation.findOneAndUpdate(
      { razorpayOrderId: payment.order_id },
      {
        razorpayPaymentId: payment.id,
        paymentStatus: 'failed',
        paymentMethod: payment.method
      },
      { new: true }
    );

    if (donation) {
      console.log(`❌ Payment failed for donation: ${donation._id}`);
      
      // TODO: Send payment failure notification email
    }
  } catch (error) {
    console.error('Error handling payment.failed:', error);
  }
}

// Handler: Order Paid
async function handleOrderPaid(order) {
  try {
    const donation = await Donation.findOneAndUpdate(
      { razorpayOrderId: order.id },
      {
        paymentStatus: 'captured',
        capturedAt: new Date()
      },
      { new: true }
    );

    if (donation) {
      console.log(`✅ Order paid for donation: ${donation._id}`);
    }
  } catch (error) {
    console.error('Error handling order.paid:', error);
  }
}

// Handler: Refund Created
async function handleRefundCreated(refund) {
  try {
    const donation = await Donation.findOneAndUpdate(
      { razorpayPaymentId: refund.payment_id },
      {
        paymentStatus: 'refunded'
      },
      { new: true }
    );

    if (donation) {
      console.log(`💸 Refund processed for donation: ${donation._id}`);
    }
  } catch (error) {
    console.error('Error handling refund.created:', error);
  }
}

// Handler: Subscription Authenticated (user completed authentication)
async function handleSubscriptionAuthenticated(subscription) {
  try {
    const donation = await Donation.findOneAndUpdate(
      { subscriptionId: subscription.id },
      {
        subscriptionStatus: 'authenticated'
      },
      { new: true }
    );

    if (donation) {
      console.log(`✅ Subscription authenticated: ${subscription.id}`);
      // TODO: Send welcome email for subscription
    }
  } catch (error) {
    console.error('Error handling subscription.authenticated:', error);
  }
}

// Handler: Subscription Activated (first payment successful)
async function handleSubscriptionActivated(subscription) {
  try {
    const donation = await Donation.findOneAndUpdate(
      { subscriptionId: subscription.id },
      {
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        paidCycles: 1
      },
      { new: true }
    );

    if (donation) {
      console.log(`✅ Subscription activated: ${subscription.id}`);
      // TODO: Send subscription activation confirmation email
    }
  } catch (error) {
    console.error('Error handling subscription.activated:', error);
  }
}

// Handler: Subscription Charged (monthly recurring charge)
async function handleSubscriptionCharged(payment) {
  try {
    const subscriptionId = payment.notes?.subscription_id || payment.subscription_id;
    
    // Find original subscription donation
    const originalDonation = await Donation.findOne({ subscriptionId });
    
    if (originalDonation) {
      // Create new donation record for this month's charge
      const newDonation = new Donation({
        donorName: originalDonation.donorName,
        donorEmail: originalDonation.donorEmail,
        donorPhone: originalDonation.donorPhone,
        amount: originalDonation.amount,
        donationType: 'monthly',
        occasion: originalDonation.occasion,
        wants80GCertificate: originalDonation.wants80GCertificate,
        wantsMahaPrasadam: originalDonation.wantsMahaPrasadam,
        panNumber: originalDonation.panNumber,
        address: originalDonation.address,
        pincode: originalDonation.pincode,
        wantsUpdates: originalDonation.wantsUpdates,
        razorpayPaymentId: payment.id,
        paymentStatus: 'captured',
        paymentMethod: payment.method,
        capturedAt: new Date(),
        parentSubscriptionId: subscriptionId,
        subscriptionId: subscriptionId,
        paidCycles: originalDonation.paidCycles + 1
      });
      
      await newDonation.save();
      
      // Update original record's paid cycles count
      await Donation.findOneAndUpdate(
        { subscriptionId },
        { 
          $inc: { paidCycles: 1 },
          nextBillingDate: new Date(payment.created_at * 1000 + 30 * 24 * 60 * 60 * 1000) // ~30 days
        }
      );
      
      console.log(`✅ Subscription charged: ${subscriptionId}, cycle: ${newDonation.paidCycles}`);
      // TODO: Send monthly donation receipt email
    }
  } catch (error) {
    console.error('Error handling subscription.charged:', error);
  }
}

// Handler: Subscription Paused
async function handleSubscriptionPaused(subscription) {
  try {
    const donation = await Donation.findOneAndUpdate(
      { subscriptionId: subscription.id },
      {
        subscriptionStatus: 'paused'
      },
      { new: true }
    );

    if (donation) {
      console.log(`⏸️  Subscription paused: ${subscription.id}`);
    }
  } catch (error) {
    console.error('Error handling subscription.paused:', error);
  }
}

// Handler: Subscription Resumed
async function handleSubscriptionResumed(subscription) {
  try {
    const donation = await Donation.findOneAndUpdate(
      { subscriptionId: subscription.id },
      {
        subscriptionStatus: 'active'
      },
      { new: true }
    );

    if (donation) {
      console.log(`▶️  Subscription resumed: ${subscription.id}`);
    }
  } catch (error) {
    console.error('Error handling subscription.resumed:', error);
  }
}

// Handler: Subscription Cancelled
async function handleSubscriptionCancelled(subscription) {
  try {
    const donation = await Donation.findOneAndUpdate(
      { subscriptionId: subscription.id },
      {
        subscriptionStatus: 'cancelled',
        subscriptionEndDate: new Date()
      },
      { new: true }
    );

    if (donation) {
      console.log(`❌ Subscription cancelled: ${subscription.id}`);
      // TODO: Send cancellation confirmation email
    }
  } catch (error) {
    console.error('Error handling subscription.cancelled:', error);
  }
}

// Handler: Subscription Completed
async function handleSubscriptionCompleted(subscription) {
  try {
    const donation = await Donation.findOneAndUpdate(
      { subscriptionId: subscription.id },
      {
        subscriptionStatus: 'completed',
        subscriptionEndDate: new Date()
      },
      { new: true }
    );

    if (donation) {
      console.log(`✅ Subscription completed: ${subscription.id}`);
    }
  } catch (error) {
    console.error('Error handling subscription.completed:', error);
  }
}

// Handler: Subscription Halted (payment failures)
async function handleSubscriptionHalted(subscription) {
  try {
    const donation = await Donation.findOneAndUpdate(
      { subscriptionId: subscription.id },
      {
        subscriptionStatus: 'halted'
      },
      { new: true }
    );

    if (donation) {
      console.log(`⚠️  Subscription halted: ${subscription.id}`);
      // TODO: Send payment failure notification email
    }
  } catch (error) {
    console.error('Error handling subscription.halted:', error);
  }
}

module.exports = router;
