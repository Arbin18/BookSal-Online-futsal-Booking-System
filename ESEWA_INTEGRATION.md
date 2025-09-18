# eSewa Payment Integration

This document describes the eSewa payment integration implemented in the BookSal application.

## Overview

The integration allows users to pay an advance amount of Rs. 50 through eSewa for their court bookings, with the remaining amount to be paid at the venue after playing.

## Features

- **Advance Payment**: Users pay Rs. 50 through eSewa
- **Remaining Payment**: Balance amount paid at venue after playing
- **Secure Integration**: Uses HMAC-SHA256 signature for security
- **Callback Handling**: Proper success/failure callback handling
- **Payment Status Tracking**: Track payment status in bookings

## Implementation Details

### Backend Components

1. **eSewa Controller** (`controllers/esewaController.js`)
   - Handles payment initiation
   - Generates HMAC signatures
   - Processes success/failure callbacks

2. **eSewa Routes** (`routes/esewaRoutes.js`)
   - `/api/esewa/initiate` - Initiate payment
   - `/api/esewa/success` - Success callback
   - `/api/esewa/failure` - Failure callback

3. **Updated Booking Model**
   - Added eSewa transaction fields
   - Enhanced payment status tracking

### Frontend Components

1. **EsewaPaymentPage** - Main payment selection page
2. **PaymentSuccess** - Success callback page
3. **PaymentFailure** - Failure callback page
4. **Updated MyBookings** - Shows eSewa payment status

### Configuration

#### Test Environment
- **Merchant Code**: `EPAYTEST`
- **Form URL**: `https://rc-epay.esewa.com.np/api/epay/main/v2/form`
- **Secret Key**: `8gBm/:&EnhH.1/q` (Test key)

#### Production Environment
- **Form URL**: `https://epay.esewa.com.np/api/epay/main/v2/form`
- **Merchant Code**: Your production merchant code
- **Secret Key**: Your production secret key

## Usage Flow

1. User selects court and time slot
2. User fills booking details
3. User is redirected to payment page
4. User chooses eSewa payment option
5. System generates payment form with signature
6. User is redirected to eSewa
7. After payment, eSewa redirects to success/failure URL
8. System processes the callback and updates booking status

## Payment Form Parameters

The following parameters are sent to eSewa:

- `amount`: Base amount (50)
- `tax_amount`: Tax amount (0)
- `total_amount`: Total amount (50)
- `transaction_uuid`: Unique transaction ID
- `product_code`: Merchant code
- `product_service_charge`: Service charge (0)
- `product_delivery_charge`: Delivery charge (0)
- `success_url`: Success callback URL
- `failure_url`: Failure callback URL
- `signed_field_names`: Fields included in signature
- `signature`: HMAC-SHA256 signature

## Security

- Uses HMAC-SHA256 for signature generation
- Validates transaction UUIDs
- Secure callback handling
- Payment status verification

## Testing

Use eSewa's test environment with the provided test credentials. Test users can be created in eSewa's test portal.

## Environment Variables

Add these to your `.env` file:

```
FRONTEND_URL=http://localhost:5173
```

## Database Changes

The Booking model now includes:
- `esewa_transaction_uuid`: Stores eSewa transaction ID
- `esewa_transaction_code`: Stores eSewa transaction code
- Enhanced `payment_status` enum with `advance_paid` and `failed`
- Enhanced `payment_method` enum with `esewa`

## Error Handling

- Payment failures are gracefully handled
- Users can retry payments
- Booking remains pending if payment fails
- Clear error messages for users