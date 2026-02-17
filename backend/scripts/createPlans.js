#!/usr/bin/env node

/**
 * Script to create Razorpay subscription plans
 * Run once: node backend/scripts/createPlans.js
 */

const Razorpay = require('razorpay');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Donation amounts to create plans for
const amounts = [500, 1000, 2500, 5000];

async function createSubscriptionPlans() {
  console.log('🚀 Creating Razorpay subscription plans...\n');
  
  const planIds = {};
  
  for (const amount of amounts) {
    try {
      const plan = await razorpay.plans.create({
        period: 'monthly',
        interval: 1,
        item: {
          name: `Subhojanam Monthly - ₹${amount}`,
          description: `Monthly donation of ₹${amount} for hospital feeding program`,
          amount: amount * 100, // amount in paise
          currency: 'INR'
        },
        notes: {
          type: 'monthly_donation',
          program: 'subhojanam',
          amount: amount
        }
      });
      
      planIds[`PLAN_${amount}`] = plan.id;
      console.log(`✅ Plan created for ₹${amount}:`);
      console.log(`   Plan ID: ${plan.id}`);
      console.log(`   Name: ${plan.item.name}`);
      console.log('');
      
    } catch (error) {
      console.error(`❌ Error creating plan for ₹${amount}:`, error.message);
    }
  }
  
  console.log('📋 Summary - Add these to your .env file:\n');
  console.log('# Razorpay Subscription Plan IDs');
  for (const [key, value] of Object.entries(planIds)) {
    console.log(`${key}=${value}`);
  }
  console.log('');
  
  console.log('✅ Plan creation complete!');
  console.log('📝 Copy the plan IDs above and add them to your .env file');
}

// Run the script
createSubscriptionPlans()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
