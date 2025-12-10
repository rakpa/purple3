import { useState } from "react";
import { Search, Edit2, Trash2, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, capitalizeFirst } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTransactions, deleteTransaction } from "@/lib/transactions";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Transaction } from "@/types/transaction";

const filterOptions = [
  { id: "this-month", label: "This Month" },
  { id: "custom", label: "Custom Range" },
  { id: "all", label: "All" },
  { id: "income", label: "Income" },
  { id: "expenses", label: "Expenses" },
];

const getDateRange = (range: string) => {
  const today = new Date();
  const ranges: Record<string, { start: Date; end: Date }> = {
    "Last 7 days": {
      start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      end: today,
    },
    "Last 30 days": {
      start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      end: today,
    },
    "Last 90 days": {
      start: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
      end: today,
    },
    "This Year": {
      start: new Date(today.getFullYear(), 0, 1),
      end: today,
    },
  };
  return ranges[range] || ranges["Last 30 days"];
};

export function TransactionList() {
  const [activeFilter, setActiveFilter] = useState("this-month");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("Last 30 days");
  const queryClient = useQueryClient();

  const dateRangeObj = getDateRange(dateRange);
  const filters: {
    startDate?: string;
    endDate?: string;
    type?: "income" | "expense";
  } = {
    startDate: format(dateRangeObj.start, "yyyy-MM-dd"),
    endDate: format(dateRangeObj.end, "yyyy-MM-dd"),
  };

  if (activeFilter === "income") {
    filters.type = "income";
  } else if (activeFilter === "expenses") {
    filters.type = "expense";
  }

  const { data: transactions = [], isLoading, error: queryError } = useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => getTransactions(filters),
    retry: false,
    onError: (error) => {
      console.error("Error fetching transactions:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      toast.success("Transaction deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete transaction: ${error.message}`);
    },
  });

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      (transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      searchQuery === "";

    const matchesFilter =
      activeFilter === "all" ||
      activeFilter === "this-month" ||
      activeFilter === "custom" ||
      (activeFilter === "income" && transaction.type === "income") ||
      (activeFilter === "expenses" && transaction.type === "expense");

    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="rounded-2xl bg-card p-6 shadow-card animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-card-foreground">Transactions</h2>
        
        {/* Date Range Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 rounded-xl">
              {dateRange}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl bg-popover border-border shadow-elevated">
            <DropdownMenuItem onClick={() => setDateRange("Last 7 days")} className="rounded-lg">
              Last 7 days
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateRange("Last 30 days")} className="rounded-lg">
              Last 30 days
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateRange("Last 90 days")} className="rounded-lg">
              Last 90 days
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateRange("This Year")} className="rounded-lg">
              This Year
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 rounded-xl border-input bg-background pl-10 shadow-sm transition-shadow focus:shadow-md"
        />
      </div>

      {/* Filter Chips */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filterOptions.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
              activeFilter === filter.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Transaction Cards */}
      {queryError ? (
        <div className="py-12 text-center">
          <p className="text-destructive mb-2">Error loading transactions</p>
          <p className="text-sm text-muted-foreground">
            {queryError instanceof Error ? queryError.message : "Please check your Supabase configuration"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Make sure you've set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file
          </p>
        </div>
      ) : isLoading ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction, index) => {
            const categoryName = transaction.category;
            return (
              <div
                key={transaction.id}
                className="group flex items-center justify-between rounded-xl border border-border bg-background p-4 transition-all duration-200 hover:border-primary/20 hover:shadow-sm"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Icon */}
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
                      transaction.type === "income"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {categoryName.charAt(0).toUpperCase()}
                  </div>

                  {/* Category - Main Title */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {categoryName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.date)}
                    </p>
                  </div>

                  {/* Description - Middle Column */}
                  {transaction.description && (
                    <div className="min-w-0 flex-1 hidden sm:block">
                      <p className="text-sm text-muted-foreground truncate">
                        {transaction.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-base font-semibold whitespace-nowrap",
                      transaction.type === "income" ? "text-success" : "text-destructive"
                    )}
                  >
                    {transaction.type === "income" ? "+" : ""}
                {Math.abs(transaction.amount).toLocaleString("pl-PL", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} PLN
                  </span>

                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => toast.info("Edit functionality coming soon!")}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(transaction.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filteredTransactions.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No transactions found</p>
        </div>
      )}
    </div>
  );
}
