const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Donation = require('../models/Donation');
const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Plan ID mapping (update these after creating plans)
const PLAN_IDS = {
  500: process.env.PLAN_500 || 'plan_500_default',
  1000: process.env.PLAN_1000 || 'plan_1000_default',
  2500: process.env.PLAN_2500 || 'plan_2500_default',
  5000: process.env.PLAN_5000 || 'plan_5000_default'
};

// Validation middleware
const subscriptionValidation = [
  body('donorName').trim().notEmpty().withMessage('Donor name is required'),
  body('donorEmail').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('donorPhone').trim().matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
  body('amount').isInt({ min: 1 }).withMessage('Amount must be at least ₹1'),
  body('panNumber').optional().trim().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN format'),
  body('pincode').optional().trim().matches(/^[0-9]{6}$/).withMessage('Invalid pincode format')
];

// @route   POST /api/subscriptions/create
// @desc    Create Razorpay subscription for monthly donations
// @access  Public
router.post('/create', subscriptionValidation, async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

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
    
    if (!planId || planId.includes('default')) {
      return res.status(400).json({
        success: false,
        message: `Subscription plan not configured for ₹${amount}. Please create plans first.`
      });
    }

    // Create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: null, // infinite recurring
      customer_notify: 1, // notify customer via SMS/email
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
      shortUrl: subscription.short_url, // Razorpay hosted page for authentication
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

// @route   GET /api/subscriptions/:subscriptionId
// @desc    Get subscription details
// @access  Public
router.get('/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    // Get from Razorpay
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    
    // Get from database
    const donation = await Donation.findOne({ subscriptionId });
    
    res.json({
      success: true,
      subscription,
      donation
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve subscription',
      error: error.message
    });
  }
});

// @route   POST /api/subscriptions/cancel/:subscriptionId
// @desc    Cancel a subscription
// @access  Public (should add auth in production)
router.post('/cancel/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { cancelAtCycleEnd } = req.body;
    
    // Cancel in Razorpay
    await razorpay.subscriptions.cancel(subscriptionId, {
      cancel_at_cycle_end: cancelAtCycleEnd || 0
    });
    
    // Update database
    await Donation.findOneAndUpdate(
      { subscriptionId },
      { 
        subscriptionStatus: 'cancelled',
        subscriptionEndDate: new Date()
      }
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

// @route   POST /api/subscriptions/pause/:subscriptionId
// @desc    Pause a subscription
// @access  Public (should add auth in production)
router.post('/pause/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    await razorpay.subscriptions.pause(subscriptionId);
    
    await Donation.findOneAndUpdate(
      { subscriptionId },
      { subscriptionStatus: 'paused' }
    );

    res.json({
      success: true,
      message: 'Subscription paused successfully'
    });

  } catch (error) {
    console.error('Pause subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pause subscription',
      error: error.message
    });
  }
});

// @route   POST /api/subscriptions/resume/:subscriptionId
// @desc    Resume a paused subscription
// @access  Public (should add auth in production)
router.post('/resume/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    await razorpay.subscriptions.resume(subscriptionId);
    
    await Donation.findOneAndUpdate(
      { subscriptionId },
      { subscriptionStatus: 'active' }
    );

    res.json({
      success: true,
      message: 'Subscription resumed successfully'
    });

  } catch (error) {
    console.error('Resume subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume subscription',
      error: error.message
    });
  }
});

module.exports = router;
