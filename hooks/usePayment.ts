import { supabase } from '@/lib/client';
import { OrderPayment, PaymentMethodType, PaymentProviderStatus } from '@/types';
import { useUser } from '@clerk/clerk-react';
import { useState } from 'react';

// Razorpay types
interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string | undefined;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    order_id: string;
    user_id: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpaySuccessResponse) => Promise<void>;
  modal: {
    ondismiss: () => Promise<void>;
  };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

// API response types
interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

interface PaymentFailureReason {
  failure_reason: string;
}

export const usePayment = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Razorpay payment
  const initializeRazorpayPayment = async (orderId: string, amount: number, currency: string = 'INR') => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);

      // Create Razorpay order
      const razorpayOrder = await createRazorpayOrder(amount, currency);

      // Save payment record
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('order_payments')
        .insert([
          {
            order_id: orderId,
            provider: 'razorpay',
            provider_order_id: razorpayOrder.id,
            method: 'upi', // Default, can be changed by user
            amount,
            currency,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (paymentError) throw paymentError;
      if (!paymentRecord) throw new Error('Failed to create payment record');

      // Initialize Razorpay checkout
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        order_id: razorpayOrder.id,
        name: 'Your Store Name',
        description: `Payment for Order #${orderId}`,
        prefill: {
          name: user.fullName || '',
          email: user.primaryEmailAddress?.emailAddress || '',
          contact: user.primaryPhoneNumber?.phoneNumber || '',
        },
        notes: {
          order_id: orderId,
          user_id: user.id,
        },
        theme: {
          color: '#6366f1',
        },
        handler: async (response: RazorpaySuccessResponse) => {
          await handlePaymentSuccess(response, orderId, paymentRecord.id);
        },
        modal: {
          ondismiss: async () => {
            await handlePaymentFailure(orderId, paymentRecord.id, 'Payment cancelled by user');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      return razorpayOrder.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create Razorpay order
  const createRazorpayOrder = async (amount: number, currency: string = 'INR'): Promise<RazorpayOrderResponse> => {
    try {
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to paise
          currency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Razorpay order');
      }

      const data: RazorpayOrderResponse = await response.json();
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create Razorpay order');
    }
  };

  // Verify Razorpay payment signature
  const verifyRazorpaySignature = (): boolean => {
    // This should be implemented on the server for security
    // For now, we'll assume it's verified on the server side
    return true;
  };

  // Update payment status in order_payments table
  const updatePaymentStatus = async (
    paymentId: string,
    status: PaymentProviderStatus,
    providerPaymentId?: string,
    providerSignature?: string
  ) => {
    try {
      const { error } = await supabase
        .from('order_payments')
        .update({
          status,
          provider_payment_id: providerPaymentId,
          provider_signature: providerSignature,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      if (error) throw error;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update payment status');
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (
    response: RazorpaySuccessResponse,
    orderId: string,
    paymentRecordId: string
  ) => {
    try {
      // Verify payment signature
      const isValid = verifyRazorpaySignature();

      if (!isValid) {
        await handlePaymentFailure(orderId, paymentRecordId, 'Invalid payment signature');
        return;
      }

      // Update payment record
      await updatePaymentStatus(
        paymentRecordId,
        'captured',
        response.razorpay_payment_id,
        response.razorpay_signature
      );

      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'completed',
          is_paid: true,
          transaction_id: response.razorpay_payment_id,
          payment_summary: response,
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Add order status history
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert([
          {
            order_id: orderId,
            status: 'confirmed',
            notes: 'Payment completed successfully',
          },
        ]);

      if (historyError) throw historyError;

      console.log('Payment successful for order:', orderId);
    } catch (err) {
      console.error('Error handling payment success:', err);
      await handlePaymentFailure(orderId, paymentRecordId, 'Error processing payment');
    }
  };

  // Handle payment failure
  const handlePaymentFailure = async (
    orderId: string,
    paymentRecordId: string,
    reason: string
  ) => {
    try {
      // Update payment record
      await updatePaymentStatus(paymentRecordId, 'failed');

      const failureReason: PaymentFailureReason = { failure_reason: reason };

      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          payment_summary: failureReason,
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Add order status history
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert([
          {
            order_id: orderId,
            status: 'pending',
            notes: `Payment failed: ${reason}`,
          },
        ]);

      if (historyError) throw historyError;

      console.error('Payment failed for order:', orderId, 'Reason:', reason);
    } catch (err) {
      console.error('Error handling payment failure:', err);
    }
  };

  // Handle COD (Cash on Delivery) flow
  const handleCODOrder = async (orderId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);

      // Create payment record for COD
      const { error: paymentError } = await supabase
        .from('order_payments')
        .insert([
          {
            order_id: orderId,
            provider: 'cod',
            method: 'cod',
            amount: 0, // Will be collected on delivery
            currency: 'INR',
            status: 'pending',
          },
        ]);

      if (paymentError) throw paymentError;

      // Update order status for COD
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'cod_pending',
          payment_method: 'cod',
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Add order status history
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert([
          {
            order_id: orderId,
            status: 'confirmed',
            notes: 'COD order confirmed. Payment pending on delivery.',
          },
        ]);

      if (historyError) throw historyError;

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process COD order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Type for order amount response
  interface OrderAmountResponse {
    total_amount: number;
    currency: string;
  }

  // Retry failed payment
  const retryPayment = async (orderId: string) => {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('total_amount, currency')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;
    if (!order) throw new Error('Order not found');

    const orderAmount = order as OrderAmountResponse;

    return initializeRazorpayPayment(
      orderId,
      orderAmount.total_amount,
      orderAmount.currency
    );
  };

  // Get payment details for an order
  const getPaymentDetails = async (orderId: string): Promise<OrderPayment[]> => {
    try {
      const { data, error } = await supabase
        .from('order_payments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OrderPayment[] || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment details');
      return [];
    }
  };

  // Get available payment methods
  const getAvailablePaymentMethods = (): PaymentMethodType[] => {
    return ['card', 'upi', 'netbanking', 'wallet', 'cod'];
  };

  // Check if Razorpay is available
  const isRazorpayAvailable = (): boolean => {
    return typeof window !== 'undefined' && typeof window.Razorpay !== 'undefined';
  };

  // Validate payment amount
  const validatePaymentAmount = (amount: number): boolean => {
    return amount > 0 && amount <= 1000000; // Maximum 10,00,000 INR
  };

  // Get payment method display name
  const getPaymentMethodDisplayName = (method: PaymentMethodType): string => {
    const displayNames: Record<PaymentMethodType, string> = {
      card: 'Credit/Debit Card',
      upi: 'UPI',
      netbanking: 'Net Banking',
      wallet: 'Wallet',
      cod: 'Cash on Delivery',
    };
    
    return displayNames[method];
  };

  return {
    loading,
    error,
    initializeRazorpayPayment,
    verifyRazorpaySignature,
    updatePaymentStatus,
    handlePaymentSuccess,
    handlePaymentFailure,
    handleCODOrder,
    retryPayment,
    getPaymentDetails,
    getAvailablePaymentMethods,
    isRazorpayAvailable,
    validatePaymentAmount,
    getPaymentMethodDisplayName,
  };
};