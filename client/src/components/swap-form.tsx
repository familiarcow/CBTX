import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSwapQuote } from "@/lib/thorchain";
import { useWeb3 } from "@/lib/web3";
import { ArrowDown } from "lucide-react";

const swapSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  destinationAddress: z.string().min(1, "BTC address is required"),
});

type SwapFormValues = z.infer<typeof swapSchema>;

export function SwapForm() {
  const { toast } = useToast();
  const { provider } = useWeb3();
  const [loading, setLoading] = useState(false);

  const form = useForm<SwapFormValues>({
    resolver: zodResolver(swapSchema),
    defaultValues: {
      amount: "",
      destinationAddress: "",
    },
  });

  async function onSubmit(values: SwapFormValues) {
    if (!provider) return;
    
    setLoading(true);
    try {
      const quote = await getSwapQuote({
        amount: values.amount,
        fromAsset: "BASE.CBBTC-0XCBB7C0000AB88B473B1F5AFD9EF808440EED33BF",
        toAsset: "BTC.BTC",
        destinationAddress: values.destinationAddress,
      });

      // Build and submit transaction here
      toast({
        title: "Quote received",
        description: `Expected output: ${quote.expected_amount_out} BTC`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get swap quote",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (cbBTC)</FormLabel>
              <FormControl>
                <Input {...field} type="number" placeholder="0.0" />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-center">
          <ArrowDown className="text-[#F2A900]" />
        </div>

        <FormField
          control={form.control}
          name="destinationAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>BTC Address</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter BTC address" />
              </FormControl>
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full bg-[#0052FF] hover:bg-[#0052FF]/90"
          disabled={loading}
        >
          {loading ? "Getting Quote..." : "Get Quote"}
        </Button>
      </form>
    </Form>
  );
}
