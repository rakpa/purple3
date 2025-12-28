import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, capitalizeFirst } from "@/lib/utils";
import { createTransaction } from "@/lib/transactions";
import { getCategories } from "@/lib/categories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { TransactionType } from "@/types/transaction";
import { CategoryIcon } from "@/components/CategoryIcon";

export function AddExpenseForm() {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const queryClient = useQueryClient();

  // Fetch categories from database
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", type],
    queryFn: () => getCategories(type),
  });


  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      toast.success(type === "expense" ? "Expense added successfully!" : "Income added successfully!");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      // Reset form
      setAmount("");
      setDescription("");
      setCategory("");
    },
    onError: (error: Error) => {
      console.error("Error creating transaction:", error);
      const errorMessage = error.message.includes("relation") || error.message.includes("permission")
        ? "Database not set up. Please run supabase-setup.sql in your Supabase dashboard."
        : error.message;
      toast.error(`Failed to add ${type}: ${errorMessage}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category) {
      toast.error("Please select a category");
      return;
    }

    mutation.mutate({
      type,
      amount: parseFloat(amount),
      date,
      description: description || null,
      category,
    });
  };

  return (
    <Card className="rounded-2xl shadow-card w-full max-w-full overflow-hidden box-border">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle>Add Expense / Income</CardTitle>
        <CardDescription>Record your financial transactions</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <form onSubmit={handleSubmit} className="space-y-5 w-full">
          {/* Type Toggle */}
          <div className="flex rounded-xl bg-muted p-1 w-full">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
                type === "expense"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
                type === "income"
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Income
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-2 w-full">
            <Label htmlFor="amount" className="text-sm font-medium text-foreground">
              Amount
            </Label>
            <div className="relative w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium z-10 pointer-events-none whitespace-nowrap">
                PLN
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-16 pr-3 h-11 rounded-xl border-input bg-background shadow-sm transition-shadow focus:shadow-md w-full leading-normal"
                required
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2 w-full">
            <Label htmlFor="date" className="text-sm font-medium text-foreground">
              Date
            </Label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="date-input-mobile flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm transition-shadow focus:shadow-md leading-normal"
              style={{ 
                height: '2.75rem',
                minHeight: '2.75rem',
                maxHeight: '2.75rem',
                paddingTop: '0.625rem',
                paddingBottom: '0.625rem',
                paddingLeft: '0.75rem',
                paddingRight: '0.75rem',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2 w-full">
            <Label htmlFor="category" className="text-sm font-medium text-foreground">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="h-11 rounded-xl border-input bg-background shadow-sm w-full px-3 leading-normal">
                <SelectValue placeholder="Select category" className="truncate">
                  {category ? (
                    (() => {
                      const selectedCat = categories.find(c => c.name === category);
                      return selectedCat ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <CategoryIcon iconName={selectedCat.icon} size={18} className="shrink-0" />
                          <span className="truncate">{category}</span>
                        </div>
                      ) : (
                        <span className="truncate">{category}</span>
                      );
                    })()
                  ) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-popover border-border shadow-elevated">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name} className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <CategoryIcon iconName={cat.icon} size={18} />
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="other" className="rounded-lg">
                    Other
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2 w-full">
            <Label htmlFor="description" className="text-sm font-medium text-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Add a note..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] rounded-xl border-input bg-background shadow-sm transition-shadow focus:shadow-md resize-none w-full px-3 py-2 leading-normal"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="xl"
            className="w-full mt-6"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? "Adding..."
              : type === "expense"
              ? "Add Expense"
              : "Add Income"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
