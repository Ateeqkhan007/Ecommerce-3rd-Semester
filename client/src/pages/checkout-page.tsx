import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

type CheckoutStep = "shipping" | "payment" | "review";

const shippingSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number should be at least 10 digits"),
  address1: z.string().min(5, "Address is required"),
  address2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State/Province is required"),
  postalCode: z.string().min(5, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
  shippingMethod: z.enum(["standard", "express", "nextDay"]),
});

const paymentSchema = z.object({
  cardName: z.string().min(2, "Name on card is required"),
  cardNumber: z.string().min(16, "Card number is required").max(16),
  expMonth: z.string().min(1, "Month is required").max(2),
  expYear: z.string().min(2, "Year is required").max(4),
  cvv: z.string().min(3, "CVV is required").max(4),
  saveCard: z.boolean().optional(),
});

type ShippingFormData = z.infer<typeof shippingSchema>;
type PaymentFormData = z.infer<typeof paymentSchema>;

export default function CheckoutPage() {
  const [step, setStep] = useState<CheckoutStep>("shipping");
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentFormData | null>(null);
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const shippingCost = shippingData ? 
    shippingData.shippingMethod === "standard" ? 9.99 : 
    shippingData.shippingMethod === "express" ? 19.99 : 29.99 
    : 9.99;
  
  const tax = subtotal * 0.06; // 6% tax
  const total = subtotal + shippingCost + tax;

  const placedOrderMutation = useMutation({
    mutationFn: async () => {
      if (!items.length) throw new Error("Cart is empty");
      
      const orderItems = items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));
      
      const res = await apiRequest("POST", "/api/orders", { items: orderItems });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Order placed successfully!",
        description: "Thank you for your purchase.",
      });
      clearCart();
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Failed to place order",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handlePlaceOrder = () => {
    placedOrderMutation.mutate();
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some products to your cart to proceed with checkout</p>
          <Button onClick={() => navigate("/")}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-8">Checkout</h1>

        {/* Checkout Steps */}
        <div className="flex justify-between mb-8">
          <div className="w-1/3 text-center">
            <div className={`mx-auto w-10 h-10 flex items-center justify-center rounded-full text-white mb-2 ${step === "shipping" || step === "payment" || step === "review" ? "bg-primary" : "bg-gray-200"}`}>
              1
            </div>
            <p className="text-sm font-medium">Shipping</p>
          </div>
          <div className="w-1/3 text-center">
            <div className={`mx-auto w-10 h-10 flex items-center justify-center rounded-full mb-2 ${step === "payment" || step === "review" ? "bg-primary text-white" : "bg-gray-200"}`}>
              2
            </div>
            <p className={`text-sm font-medium ${step === "payment" || step === "review" ? "" : "text-gray-500"}`}>Payment</p>
          </div>
          <div className="w-1/3 text-center">
            <div className={`mx-auto w-10 h-10 flex items-center justify-center rounded-full mb-2 ${step === "review" ? "bg-primary text-white" : "bg-gray-200"}`}>
              3
            </div>
            <p className={`text-sm font-medium ${step === "review" ? "" : "text-gray-500"}`}>Review</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row -mx-4">
          {/* Checkout Form */}
          <div className="lg:w-2/3 px-4 mb-8 lg:mb-0">
            {step === "shipping" && (
              <ShippingForm 
                onSubmit={(data) => {
                  setShippingData(data);
                  setStep("payment");
                }}
                defaultValues={shippingData}
              />
            )}

            {step === "payment" && (
              <PaymentForm 
                onSubmit={(data) => {
                  setPaymentData(data);
                  setStep("review");
                }}
                onBack={() => setStep("shipping")}
                defaultValues={paymentData}
              />
            )}

            {step === "review" && (
              <OrderReview 
                shippingData={shippingData!}
                paymentData={paymentData!}
                onBack={() => setStep("payment")}
                onConfirm={handlePlaceOrder}
                isSubmitting={placedOrderMutation.isPending}
              />
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3 px-4">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex space-x-4 pb-4 border-b">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{item.product.name}</h3>
                        <span className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                      <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Discount Code */}
              <div className="mt-6">
                <div className="flex space-x-2">
                  <Input placeholder="Discount code" className="flex-1" />
                  <Button variant="outline">Apply</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ShippingForm({ 
  onSubmit,
  defaultValues
}: { 
  onSubmit: (data: ShippingFormData) => void; 
  defaultValues: ShippingFormData | null;
}) {
  const form = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: defaultValues || {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "United States",
      shippingMethod: "standard",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Shipping Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address1"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address2"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Address Line 2 (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State/Province</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      {...field}
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Shipping Method */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Shipping Method</h2>

          <FormField
            control={form.control}
            name="shippingMethod"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-md">
                      <RadioGroupItem id="standard" value="standard" />
                      <div className="flex justify-between w-full">
                        <div>
                          <label htmlFor="standard" className="font-medium cursor-pointer">Standard Shipping</label>
                          <p className="text-sm text-gray-500">Delivery in 3-5 business days</p>
                        </div>
                        <span className="font-medium">$9.99</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-md">
                      <RadioGroupItem id="express" value="express" />
                      <div className="flex justify-between w-full">
                        <div>
                          <label htmlFor="express" className="font-medium cursor-pointer">Express Shipping</label>
                          <p className="text-sm text-gray-500">Delivery in 1-2 business days</p>
                        </div>
                        <span className="font-medium">$19.99</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-md">
                      <RadioGroupItem id="nextDay" value="nextDay" />
                      <div className="flex justify-between w-full">
                        <div>
                          <label htmlFor="nextDay" className="font-medium cursor-pointer">Next Day Delivery</label>
                          <p className="text-sm text-gray-500">Order before 2pm for same day dispatch</p>
                        </div>
                        <span className="font-medium">$29.99</span>
                      </div>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-6">
          <Button type="submit" className="w-full">
            Continue to Payment
          </Button>
        </div>
      </form>
    </Form>
  );
}

function PaymentForm({ 
  onSubmit, 
  onBack,
  defaultValues
}: { 
  onSubmit: (data: PaymentFormData) => void;
  onBack: () => void;
  defaultValues: PaymentFormData | null;
}) {
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: defaultValues || {
      cardName: "",
      cardNumber: "",
      expMonth: "",
      expYear: "",
      cvv: "",
      saveCard: false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Payment Information</h2>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="cardName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name on Card</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Number</FormLabel>
                  <FormControl>
                    <Input placeholder="1234 5678 9012 3456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="expMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month</FormLabel>
                    <FormControl>
                      <Input placeholder="MM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input placeholder="YYYY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cvv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CVV</FormLabel>
                    <FormControl>
                      <Input placeholder="123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="saveCard"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm text-gray-600">Save this card for future orders</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <Button type="button" variant="outline" className="w-1/2" onClick={onBack}>
            Back to Shipping
          </Button>
          <Button type="submit" className="w-1/2">
            Review Order
          </Button>
        </div>
      </form>
    </Form>
  );
}

function OrderReview({ 
  shippingData, 
  paymentData, 
  onBack,
  onConfirm,
  isSubmitting
}: { 
  shippingData: ShippingFormData;
  paymentData: PaymentFormData;
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Review Your Order</h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg">Shipping Information</h3>
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-sm font-medium text-gray-600">Name:</p>
                <p>{shippingData.firstName} {shippingData.lastName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Email:</p>
                <p>{shippingData.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Phone:</p>
                <p>{shippingData.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Shipping Method:</p>
                <p>
                  {shippingData.shippingMethod === "standard" 
                    ? "Standard Shipping ($9.99)" 
                    : shippingData.shippingMethod === "express" 
                      ? "Express Shipping ($19.99)" 
                      : "Next Day Delivery ($29.99)"}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-600">Address:</p>
              <p>{shippingData.address1}</p>
              {shippingData.address2 && <p>{shippingData.address2}</p>}
              <p>{shippingData.city}, {shippingData.state} {shippingData.postalCode}</p>
              <p>{shippingData.country}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-lg">Payment Information</h3>
            <Separator className="my-2" />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-sm font-medium text-gray-600">Name on Card:</p>
                <p>{paymentData.cardName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Card Number:</p>
                <p>xxxx xxxx xxxx {paymentData.cardNumber.slice(-4)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Expiration:</p>
                <p>{paymentData.expMonth}/{paymentData.expYear}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          By clicking "Place Order", you agree to our Terms of Service and Privacy Policy. 
          You also consent to our processing your payment information.
        </p>

        <div className="flex space-x-4">
          <Button type="button" variant="outline" className="w-1/2" onClick={onBack} disabled={isSubmitting}>
            Back to Payment
          </Button>
          <Button onClick={onConfirm} className="w-1/2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              "Place Order"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
