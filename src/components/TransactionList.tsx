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
import { cn } from "@/lib/utils";

const filters = [
  { id: "this-month", label: "This Month" },
  { id: "custom", label: "Custom Range" },
  { id: "all", label: "All" },
  { id: "income", label: "Income" },
  { id: "expenses", label: "Expenses" },
];

const mockTransactions = [
  {
    id: 1,
    merchant: "Swiggy",
    category: "Food & Dining",
    date: "Nov 28, 2024",
    amount: -450,
    type: "expense",
  },
  {
    id: 2,
    merchant: "Salary - TechCorp",
    category: "Salary",
    date: "Nov 25, 2024",
    amount: 85000,
    type: "income",
  },
  {
    id: 3,
    merchant: "Amazon",
    category: "Shopping",
    date: "Nov 24, 2024",
    amount: -2999,
    type: "expense",
  },
  {
    id: 4,
    merchant: "Uber",
    category: "Transportation",
    date: "Nov 23, 2024",
    amount: -320,
    type: "expense",
  },
  {
    id: 5,
    merchant: "Freelance Project",
    category: "Freelance",
    date: "Nov 20, 2024",
    amount: 15000,
    type: "income",
  },
  {
    id: 6,
    merchant: "Netflix",
    category: "Entertainment",
    date: "Nov 18, 2024",
    amount: -649,
    type: "expense",
  },
  {
    id: 7,
    merchant: "Electricity Bill",
    category: "Utilities",
    date: "Nov 15, 2024",
    amount: -1850,
    type: "expense",
  },
];

export function TransactionList() {
  const [activeFilter, setActiveFilter] = useState("this-month");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("Last 30 days");

  const filteredTransactions = mockTransactions.filter((transaction) => {
    const matchesSearch =
      transaction.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === "all" ||
      activeFilter === "this-month" ||
      activeFilter === "custom" ||
      (activeFilter === "income" && transaction.type === "income") ||
      (activeFilter === "expenses" && transaction.type === "expense");

    return matchesSearch && matchesFilter;
  });

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
        {filters.map((filter) => (
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
      <div className="space-y-3">
        {filteredTransactions.map((transaction, index) => (
          <div
            key={transaction.id}
            className="group flex items-center justify-between rounded-xl border border-border bg-background p-4 transition-all duration-200 hover:border-primary/20 hover:shadow-sm"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-4 min-w-0">
              {/* Icon */}
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
                  transaction.type === "income"
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {transaction.merchant.charAt(0)}
              </div>

              {/* Details */}
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {transaction.merchant}
                </p>
                <p className="text-sm text-muted-foreground">
                  {transaction.category} • {transaction.date}
                </p>
              </div>
            </div>

            {/* Amount & Actions */}
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "text-base font-semibold whitespace-nowrap",
                  transaction.type === "income" ? "text-success" : "text-destructive"
                )}
              >
                {transaction.type === "income" ? "+" : ""}₹
                {Math.abs(transaction.amount).toLocaleString("en-IN")}
              </span>

              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No transactions found</p>
        </div>
      )}
    </div>
  );
}
