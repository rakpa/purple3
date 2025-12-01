import { useState } from "react";
import { CalendarIcon, DollarSign } from "lucide-react";
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
import { cn } from "@/lib/utils";

const categories = [
  { value: "food", label: "Food & Dining" },
  { value: "transport", label: "Transportation" },
  { value: "utilities", label: "Utilities" },
  { value: "entertainment", label: "Entertainment" },
  { value: "shopping", label: "Shopping" },
  { value: "health", label: "Health" },
  { value: "salary", label: "Salary" },
  { value: "freelance", label: "Freelance" },
  { value: "investment", label: "Investment" },
  { value: "other", label: "Other" },
];

export function AddExpenseForm() {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ type, amount, date, description, category });
    // Reset form
    setAmount("");
    setDescription("");
    setCategory("");
  };

  return (
    <div className="rounded-2xl bg-card p-6 shadow-card animate-fade-in">
      <h2 className="mb-6 text-xl font-semibold text-card-foreground">
        Add Expense / Income
      </h2>

      {/* Toggle Buttons */}
      <div className="mb-6 flex rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={cn(
            "flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
            type === "expense"
              ? "bg-card text-destructive shadow-sm"
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
              ? "bg-card text-success shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Income
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium text-foreground">
            Amount
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              ₹
            </span>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-8 h-11 rounded-xl border-input bg-background shadow-sm transition-shadow focus:shadow-md"
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
              className="h-11 rounded-xl border-input bg-background shadow-sm transition-shadow focus:shadow-md"
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
            <SelectTrigger className="h-11 rounded-xl border-input bg-background shadow-sm">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-popover border-border shadow-elevated">
              {categories
                .filter((cat) =>
                  type === "income"
                    ? ["salary", "freelance", "investment", "other"].includes(cat.value)
                    : !["salary", "freelance", "investment"].includes(cat.value)
                )
                .map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="rounded-lg">
                    {cat.label}
                  </SelectItem>
                ))}
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
            className="min-h-[80px] rounded-xl border-input bg-background shadow-sm resize-none transition-shadow focus:shadow-md"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="gradient"
          size="xl"
          className="w-full mt-6"
        >
          {type === "expense" ? "Add Expense" : "Add Income"}
        </Button>
      </form>
    </div>
  );
}
