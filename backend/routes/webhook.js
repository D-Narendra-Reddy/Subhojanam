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

module.exports = router;
