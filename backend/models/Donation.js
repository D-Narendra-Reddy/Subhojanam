const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  // Donor Information
  donorName: {
    type: String,
    required: true,
    trim: true
  },
  donorEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  donorPhone: {
    type: String,
    required: true,
    trim: true
  },
  
  // Donation Details
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  donationType: {
    type: String,
    enum: ['onetime', 'monthly'],
    default: 'onetime'
  },
  occasion: {
    type: String,
    enum: ['general', 'birthday', 'anniversary', 'memory', 'other'],
    default: 'general'
  },
  sevaDate: {
    type: Date
  },
  dateOfBirth: {
    type: Date
  },
  
  // Tax & Prasadam Options
  wants80GCertificate: {
    type: Boolean,
    default: false
  },
  wantsMahaPrasadam: {
    type: Boolean,
    default: false
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true,
    sparse: true
  },
  address: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  
  // Razorpay Payment Details
  razorpayOrderId: {
    type: String,
    trim: true
  },
  razorpayPaymentId: {
    type: String,
    trim: true,
    sparse: true
  },
  razorpaySignature: {
    type: String,
    trim: true
  },
  
  // Payment Status
  paymentStatus: {
    type: String,
    enum: ['created', 'pending', 'authorized', 'captured', 'failed', 'refunded'],
    default: 'created'
  },
  
  // Additional Razorpay Details
  paymentMethod: {
    type: String,
    trim: true
  },
  paymentBank: {
    type: String,
    trim: true
  },
  paymentWallet: {
    type: String,
    trim: true
  },
  paymentVpa: {
    type: String,
    trim: true
  },
  paymentCardId: {
    type: String,
    trim: true
  },
  
  // Timestamps from Razorpay
  authorizedAt: {
    type: Date
  },
  capturedAt: {
    type: Date
  },
  
  // Metadata
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  
  // Communication Preferences
  wantsUpdates: {
    type: Boolean,
    default: true
  },
  
  // 80G Certificate
  certificateGenerated: {
    type: Boolean,
    default: false
  },
  certificateNumber: {
    type: String,
    trim: true
  },
  
  // Prasadam Delivery
  prasadamDelivered: {
    type: Boolean,
    default: false
  },
  deliveryTrackingId: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
donationSchema.index({ donorEmail: 1 });
donationSchema.index({ razorpayOrderId: 1 });
donationSchema.index({ razorpayPaymentId: 1 });
donationSchema.index({ paymentStatus: 1 });
donationSchema.index({ createdAt: -1 });

// Virtual for calculating number of meals
donationSchema.virtual('mealsServed').get(function() {
  return Math.floor(this.amount / 25);
});

// Ensure virtuals are included in JSON
donationSchema.set('toJSON', { virtuals: true });
donationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Donation', donationSchema);
