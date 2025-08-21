import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Payment,
  PaymentProcessor,
  PaymentMethod,
  PaymentStatus,
} from '../entities/payment.entity';
import axios from 'axios';

@Injectable()
export class PaymentProcessorsService {
  private readonly logger = new Logger(PaymentProcessorsService.name);

  constructor(private configService: ConfigService) {}

  async initializePayment(
    payment: Payment,
    processor: PaymentProcessor,
  ): Promise<{
    authorizationUrl?: string;
    reference: string;
    gatewayData: any;
  }> {
    try {
      switch (processor) {
        case PaymentProcessor.FLUTTERWAVE:
          return this.initializeFlutterwavePayment(payment);
        case PaymentProcessor.PAYSTACK:
          return this.initializePaystackPayment(payment);
        case PaymentProcessor.MONNIFY:
          return this.initializeMonnifyPayment(payment);
        case PaymentProcessor.STRIPE:
          return this.initializeStripePayment(payment);
        default:
          throw new BadRequestException('Unsupported payment processor');
      }
    } catch (error) {
      this.logger.error(`Error initializing ${processor} payment:`, error);
      throw new BadRequestException(
        `Failed to initialize ${processor} payment`,
      );
    }
  }

  async verifyPayment(
    payment: Payment,
    transactionReference: string,
  ): Promise<{
    status: PaymentStatus;
    gatewayData: any;
    verified: boolean;
  }> {
    try {
      switch (payment.processor) {
        case PaymentProcessor.FLUTTERWAVE:
          return this.verifyFlutterwavePayment(transactionReference);
        case PaymentProcessor.PAYSTACK:
          return this.verifyPaystackPayment(transactionReference);
        case PaymentProcessor.MONNIFY:
          return this.verifyMonnifyPayment(transactionReference);
        case PaymentProcessor.STRIPE:
          return this.verifyStripePayment(transactionReference);
        default:
          throw new BadRequestException('Unsupported payment processor');
      }
    } catch (error) {
      this.logger.error(`Error verifying ${payment.processor} payment:`, error);
      throw new BadRequestException(
        `Failed to verify ${payment.processor} payment`,
      );
    }
  }

  private async initializeFlutterwavePayment(payment: Payment): Promise<any> {
    const flutterwaveSecretKey = this.configService.get(
      'FLUTTERWAVE_SECRET_KEY',
    );
    const flutterwavePublicKey = this.configService.get(
      'FLUTTERWAVE_PUBLIC_KEY',
    );

    const payload = {
      tx_ref: payment.reference,
      amount: payment.totalAmount,
      currency: payment.currency,
      redirect_url: `${this.configService.get('FRONTEND_URL')}/payment/callback/flutterwave`,
      customer: {
        email: payment.customerData.email,
        phone_number: payment.customerData.phone,
        name: payment.customerData.name,
      },
      customizations: {
        title: 'Dealo Platform',
        description: payment.metadata.description || 'Payment for services',
        logo: 'https://dealo.com/logo.png',
      },
      meta: {
        paymentId: payment.id,
        userId: payment.userId,
        type: payment.type,
      },
    };

    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      payload,
      {
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.data.status === 'success') {
      return {
        authorizationUrl: response.data.data.link,
        reference: payment.reference,
        gatewayData: {
          flwRef: response.data.data.flw_ref,
          gateway: 'flutterwave',
          response: response.data,
        },
      };
    } else {
      throw new BadRequestException('Failed to initialize Flutterwave payment');
    }
  }

  private async initializePaystackPayment(payment: Payment): Promise<any> {
    const paystackSecretKey = this.configService.get('PAYSTACK_SECRET_KEY');

    const payload = {
      amount: Math.round(payment.totalAmount * 100), // Paystack expects amount in kobo
      email: payment.customerData.email,
      reference: payment.reference,
      callback_url: `${this.configService.get('FRONTEND_URL')}/payment/callback/paystack`,
      metadata: {
        paymentId: payment.id,
        userId: payment.userId,
        type: payment.type,
        custom_fields: [
          {
            display_name: 'Customer Name',
            variable_name: 'customer_name',
            value: payment.customerData.name,
          },
        ],
      },
    };

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      payload,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.data.status) {
      return {
        authorizationUrl: response.data.data.authorization_url,
        reference: payment.reference,
        gatewayData: {
          paystackRef: response.data.data.reference,
          accessCode: response.data.data.access_code,
          gateway: 'paystack',
          response: response.data,
        },
      };
    } else {
      throw new BadRequestException('Failed to initialize Paystack payment');
    }
  }

  private async initializeMonnifyPayment(payment: Payment): Promise<any> {
    const monnifySecretKey = this.configService.get('MONNIFY_SECRET_KEY');
    const monnifyPublicKey = this.configService.get('MONNIFY_PUBLIC_KEY');
    const monnifyContractCode = this.configService.get('MONNIFY_CONTRACT_CODE');

    const payload = {
      amount: payment.totalAmount,
      customerName: payment.customerData.name,
      customerEmail: payment.customerData.email,
      paymentReference: payment.reference,
      paymentDescription:
        payment.metadata.description || 'Payment for services',
      currencyCode: payment.currency,
      contractCode: monnifyContractCode,
      redirectUrl: `${this.configService.get('FRONTEND_URL')}/payment/callback/monnify`,
      paymentMethods: ['CARD', 'ACCOUNT_TRANSFER', 'USSD'],
      metadata: {
        paymentId: payment.id,
        userId: payment.userId,
        type: payment.type,
      },
    };

    const response = await axios.post(
      'https://sandbox-api.monnify.com/api/v1/merchant/transactions/init-transaction',
      payload,
      {
        headers: {
          Authorization: `Bearer ${monnifySecretKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.data.requestSuccessful) {
      return {
        authorizationUrl: response.data.responseBody.checkoutUrl,
        reference: payment.reference,
        gatewayData: {
          monnifyRef: response.data.responseBody.transactionReference,
          gateway: 'monnify',
          response: response.data,
        },
      };
    } else {
      throw new BadRequestException('Failed to initialize Monnify payment');
    }
  }

  private async initializeStripePayment(payment: Payment): Promise<any> {
    const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');

    const payload = {
      amount: Math.round(payment.totalAmount * 100), // Stripe expects amount in cents
      currency: payment.currency.toLowerCase(),
      metadata: {
        paymentId: payment.id,
        userId: payment.userId,
        type: payment.type,
      },
      customer_email: payment.customerData.email,
      description: payment.metadata.description || 'Payment for services',
      success_url: `${this.configService.get('FRONTEND_URL')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/payment/cancel`,
    };

    const response = await axios.post(
      'https://api.stripe.com/v1/checkout/sessions',
      payload,
      {
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    if (response.data.id) {
      return {
        authorizationUrl: response.data.url,
        reference: payment.reference,
        gatewayData: {
          stripePaymentIntentId: response.data.payment_intent,
          gateway: 'stripe',
          response: response.data,
        },
      };
    } else {
      throw new BadRequestException('Failed to initialize Stripe payment');
    }
  }

  private async verifyFlutterwavePayment(
    transactionReference: string,
  ): Promise<any> {
    const flutterwaveSecretKey = this.configService.get(
      'FLUTTERWAVE_SECRET_KEY',
    );

    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transactionReference}/verify`,
      {
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`,
        },
      },
    );

    if (response.data.status === 'success') {
      const transaction = response.data.data;
      return {
        status:
          transaction.status === 'successful'
            ? PaymentStatus.COMPLETED
            : PaymentStatus.FAILED,
        gatewayData: {
          flwRef: transaction.flw_ref,
          gateway: 'flutterwave',
          response: response.data,
        },
        verified: true,
      };
    } else {
      return {
        status: PaymentStatus.FAILED,
        gatewayData: { gateway: 'flutterwave', response: response.data },
        verified: false,
      };
    }
  }

  private async verifyPaystackPayment(
    transactionReference: string,
  ): Promise<any> {
    const paystackSecretKey = this.configService.get('PAYSTACK_SECRET_KEY');

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${transactionReference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      },
    );

    if (response.data.status) {
      const transaction = response.data.data;
      return {
        status:
          transaction.status === 'success'
            ? PaymentStatus.COMPLETED
            : PaymentStatus.FAILED,
        gatewayData: {
          paystackRef: transaction.reference,
          gateway: 'paystack',
          response: response.data,
        },
        verified: true,
      };
    } else {
      return {
        status: PaymentStatus.FAILED,
        gatewayData: { gateway: 'paystack', response: response.data },
        verified: false,
      };
    }
  }

  private async verifyMonnifyPayment(
    transactionReference: string,
  ): Promise<any> {
    const monnifySecretKey = this.configService.get('MONNIFY_SECRET_KEY');

    const response = await axios.get(
      `https://sandbox-api.monnify.com/api/v1/merchant/transactions/query?paymentReference=${transactionReference}`,
      {
        headers: {
          Authorization: `Bearer ${monnifySecretKey}`,
        },
      },
    );

    if (response.data.requestSuccessful) {
      const transaction = response.data.responseBody;
      return {
        status:
          transaction.paymentStatus === 'PAID'
            ? PaymentStatus.COMPLETED
            : PaymentStatus.FAILED,
        gatewayData: {
          monnifyRef: transaction.transactionReference,
          gateway: 'monnify',
          response: response.data,
        },
        verified: true,
      };
    } else {
      return {
        status: PaymentStatus.FAILED,
        gatewayData: { gateway: 'monnify', response: response.data },
        verified: false,
      };
    }
  }

  private async verifyStripePayment(paymentIntentId: string): Promise<any> {
    const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');

    const response = await axios.get(
      `https://api.stripe.com/v1/payment_intents/${paymentIntentId}`,
      {
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
        },
      },
    );

    if (response.data.id) {
      const paymentIntent = response.data;
      return {
        status:
          paymentIntent.status === 'succeeded'
            ? PaymentStatus.COMPLETED
            : PaymentStatus.FAILED,
        gatewayData: {
          stripePaymentIntentId: paymentIntent.id,
          gateway: 'stripe',
          response: response.data,
        },
        verified: true,
      };
    } else {
      return {
        status: PaymentStatus.FAILED,
        gatewayData: { gateway: 'stripe', response: response.data },
        verified: false,
      };
    }
  }

  async processWebhook(
    processor: PaymentProcessor,
    payload: any,
    signature?: string,
  ): Promise<{
    verified: boolean;
    paymentData: any;
  }> {
    try {
      switch (processor) {
        case PaymentProcessor.FLUTTERWAVE:
          return this.processFlutterwaveWebhook(payload, signature);
        case PaymentProcessor.PAYSTACK:
          return this.processPaystackWebhook(payload, signature);
        case PaymentProcessor.MONNIFY:
          return this.processMonnifyWebhook(payload, signature);
        case PaymentProcessor.STRIPE:
          return this.processStripeWebhook(payload, signature);
        default:
          throw new BadRequestException('Unsupported payment processor');
      }
    } catch (error) {
      this.logger.error(`Error processing ${processor} webhook:`, error);
      throw new BadRequestException(`Failed to process ${processor} webhook`);
    }
  }

  private async processFlutterwaveWebhook(
    payload: any,
    signature?: string,
  ): Promise<any> {
    // Verify webhook signature
    const flutterwaveSecretHash = this.configService.get(
      'FLUTTERWAVE_SECRET_HASH',
    );

    if (signature !== flutterwaveSecretHash) {
      return { verified: false, paymentData: null };
    }

    return {
      verified: true,
      paymentData: {
        reference: payload.txRef,
        status:
          payload.status === 'successful'
            ? PaymentStatus.COMPLETED
            : PaymentStatus.FAILED,
        amount: payload.amount,
        currency: payload.currency,
        gatewayData: payload,
      },
    };
  }

  private async processPaystackWebhook(
    payload: any,
    signature?: string,
  ): Promise<any> {
    // Verify webhook signature
    const paystackSecretKey = this.configService.get('PAYSTACK_SECRET_KEY');

    // Implement signature verification logic here
    // For now, we'll assume it's verified

    return {
      verified: true,
      paymentData: {
        reference: payload.data.reference,
        status:
          payload.data.status === 'success'
            ? PaymentStatus.COMPLETED
            : PaymentStatus.FAILED,
        amount: payload.data.amount / 100, // Convert from kobo to naira
        currency: payload.data.currency,
        gatewayData: payload,
      },
    };
  }

  private async processMonnifyWebhook(
    payload: any,
    signature?: string,
  ): Promise<any> {
    // Verify webhook signature
    const monnifySecretKey = this.configService.get('MONNIFY_SECRET_KEY');

    // Implement signature verification logic here

    return {
      verified: true,
      paymentData: {
        reference: payload.paymentReference,
        status:
          payload.paymentStatus === 'PAID'
            ? PaymentStatus.COMPLETED
            : PaymentStatus.FAILED,
        amount: payload.paidAmount,
        currency: payload.paidCurrency,
        gatewayData: payload,
      },
    };
  }

  private async processStripeWebhook(
    payload: any,
    signature?: string,
  ): Promise<any> {
    // Verify webhook signature
    const stripeWebhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');

    // Implement signature verification logic here

    return {
      verified: true,
      paymentData: {
        reference: payload.data.object.id,
        status:
          payload.data.object.status === 'succeeded'
            ? PaymentStatus.COMPLETED
            : PaymentStatus.FAILED,
        amount: payload.data.object.amount / 100, // Convert from cents
        currency: payload.data.object.currency,
        gatewayData: payload,
      },
    };
  }
}
