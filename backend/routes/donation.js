const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Donation = require('../models/Donation');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Validation middleware
const donationValidation = [
  body('donorName').trim().notEmpty().withMessage('Donor name is required'),
  body('donorEmail').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('donorPhone').trim().matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
  body('amount').isInt({ min: 1 }).withMessage('Amount must be at least ₹1'),
  body('donationType').optional().isIn(['onetime', 'monthly']).withMessage('Invalid donation type'),
  body('occasion').optional().isIn(['general', 'birthday', 'anniversary', 'memory', 'other']),
  body('panNumber').optional().trim().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN format'),
  body('pincode').optional().trim().matches(/^[0-9]{6}$/).withMessage('Invalid pincode format')
];

// @route   POST /api/donations/create-order
// @desc    Create Razorpay order and save donation record
// @access  Public
router.post('/create-order', donationValidation, async (req, res) => {
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
      donationType,
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

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        donorName,
        donorEmail,
        donorPhone,
        occasion: occasion || 'general'
      }
    };

    const order = await razorpay.orders.create(options);

    // Create donation record
    const donation = new Donation({
      donorName,
      donorEmail,
      donorPhone,
      amount,
      donationType: donationType || 'onetime',
      occasion: occasion || 'general',
      sevaDate: sevaDate ? new Date(sevaDate) : undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      wants80GCertificate: wants80GCertificate || false,
      wantsMahaPrasadam: wantsMahaPrasadam || false,
      panNumber: panNumber || undefined,
      address: address || undefined,
      pincode: pincode || undefined,
      wantsUpdates: wantsUpdates !== false,
      razorpayOrderId: order.id,
      paymentStatus: 'created',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });

    await donation.save();

    res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      donationId: donation._id,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// @route   POST /api/donations/verify-payment
// @desc    Verify Razorpay payment signature and update donation
// @access  Public
router.post('/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification details'
      });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Update donation record
      const donation = await Donation.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paymentStatus: 'captured',
          capturedAt: new Date()
        },
        { new: true }
      );

      if (!donation) {
        return res.status(404).json({
          success: false,
          message: 'Donation record not found'
        });
      }

      // TODO: Trigger email for 80G certificate if requested
      // TODO: Trigger prasadam delivery process if requested

      res.json({
        success: true,
        message: 'Payment verified successfully',
        donation: {
          id: donation._id,
          amount: donation.amount,
          mealsServed: donation.mealsServed,
          donorName: donation.donorName,
          occasion: donation.occasion
        }
      });
    } else {
      // Update as failed
      await Donation.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { paymentStatus: 'failed' }
      );

      res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
});

// @route   GET /api/donations/:id
// @desc    Get donation details by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).select('-razorpaySignature');
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    res.json({
      success: true,
      donation
    });

  } catch (error) {
    console.error('Get donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve donation',
      error: error.message
    });
  }
});

// @route   GET /api/donations/stats/summary
// @desc    Get donation statistics
// @access  Public
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Donation.aggregate([
      {
        $match: { paymentStatus: 'captured' }
      },
      {
        $group: {
          _id: null,
          totalDonations: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgDonation: { $avg: '$amount' }
        }
      }
    ]);

    const result = stats[0] || {
      totalDonations: 0,
      totalAmount: 0,
      avgDonation: 0
    };

    result.totalMeals = Math.floor(result.totalAmount / 25);

    res.json({
      success: true,
      stats: result
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error.message
    });
  }
});

module.exports = router;
