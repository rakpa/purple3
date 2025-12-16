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
    <div className="rounded-2xl bg-card p-4 sm:p-6 shadow-card animate-fade-in w-full max-w-full">
      <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold text-card-foreground">
        Add Expense / Income
      </h2>

      {/* Toggle Buttons */}
      <div className="mb-4 sm:mb-6 flex rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={cn(
            "flex-1 rounded-lg py-2 sm:py-2.5 text-sm font-medium transition-all duration-200",
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
            "flex-1 rounded-lg py-2 sm:py-2.5 text-sm font-medium transition-all duration-200",
            type === "income"
              ? "bg-green-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Income
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium text-foreground">
            Amount
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
              PLN
            </span>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-14 h-11 rounded-xl border-input bg-background shadow-sm transition-shadow focus:shadow-md w-full"
              required
            />
          </div>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm font-medium text-foreground">
            Date
          </Label>
          <div className="relative">
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 rounded-xl border-input bg-background shadow-sm transition-shadow focus:shadow-md w-full"
              required
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium text-foreground">
            Category
          </Label>
          <Select value={category} onValueChange={setCategory} required>
            <SelectTrigger className="h-11 rounded-xl border-input bg-background shadow-sm w-full">
              <SelectValue placeholder="Select category">
                {category ? (
                  (() => {
                    const selectedCat = categories.find(c => c.name === category);
                    return selectedCat ? (
                      <div className="flex items-center gap-2">
                        <CategoryIcon iconName={selectedCat.icon} size={16} />
                        <span>{category}</span>
                      </div>
                    ) : category;
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
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-foreground">
            Description
          </Label>
          <Textarea
            id="description"
            placeholder="Add a note..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[80px] rounded-xl border-input bg-background shadow-sm resize-none transition-shadow focus:shadow-md w-full"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="xl"
          className="w-full mt-4 sm:mt-6 h-11 sm:h-12"
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? "Adding..."
            : type === "expense"
            ? "Add Expense"
            : "Add Income"}
        </Button>
      </form>
    </div>
  );
}
