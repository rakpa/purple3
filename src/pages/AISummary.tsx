import { useState, useMemo } from "react";
import { Sparkles, Search, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "@/lib/transactions";
import { getCategories } from "@/lib/categories";
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from "date-fns";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface QueryResult {
  total: number;
  count: number;
  type: "expense" | "income" | "both";
  category?: string;
  period: string;
  query: string;
}

export default function AISummary() {
  const [query, setQuery] = useState("");
  const [parsedQuery, setParsedQuery] = useState<QueryResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch all categories for better matching
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  // Parse natural language query
  const parseQuery = (userQuery: string, availableCategories: string[]): { filters: any; queryInfo: QueryResult } | null => {
    const lowerQuery = userQuery.toLowerCase();
    
    // Determine transaction type
    let type: "expense" | "income" | undefined = undefined;
    if (lowerQuery.includes("spent") || lowerQuery.includes("expense") || lowerQuery.includes("cost")) {
      type = "expense";
    } else if (lowerQuery.includes("earned") || lowerQuery.includes("income") || lowerQuery.includes("received")) {
      type = "income";
    }

    // Match against actual categories from database - prioritize exact matches
    let matchedCategory: string | undefined = undefined;
    const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2);
    
    // First, try exact phrase matching (e.g., "poland rent" should match "Poland Rent")
    // Sort categories by length (longer first) to match more specific categories first
    const sortedCategories = [...availableCategories].sort((a, b) => b.length - a.length);
    
    for (const category of sortedCategories) {
      const lowerCategory = category.toLowerCase();
      // Check if query contains the full category name as a phrase
      if (lowerQuery.includes(lowerCategory)) {
        matchedCategory = category;
        break;
      }
    }
    
    // If no exact phrase match, try word-by-word matching (all category words must be in query)
    if (!matchedCategory) {
      for (const category of sortedCategories) {
        const lowerCategory = category.toLowerCase();
        const categoryWords = lowerCategory.split(/\s+/).filter(w => w.length > 2);
        // Check if all significant words from category are present in query
        if (categoryWords.length > 0) {
          const allWordsMatch = categoryWords.every(catWord => 
            queryWords.some(qWord => qWord === catWord || qWord.includes(catWord) || catWord.includes(qWord))
          );
          if (allWordsMatch) {
            matchedCategory = category;
            break;
          }
        }
      }
    }

    // Fallback to keyword matching if no exact category match
    if (!matchedCategory) {
      const categoryKeywords: { [key: string]: string[] } = {
        "rent": ["rent", "rental"],
        "groceries": ["grocery", "groceries", "food"],
        "transport": ["transport", "taxi", "uber", "bolt"],
        "subscriptions": ["subscription", "subscriptions"],
        "bills": ["bill", "bills", "utility"],
        "entertainment": ["entertainment", "movie", "cinema"],
        "health": ["health", "medical", "doctor"],
        "education": ["education", "school", "learning"],
      };

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => lowerQuery.includes(keyword))) {
          // Try to find a matching category in the database
          const found = availableCategories.find(cat => 
            cat.toLowerCase().includes(category) || category.includes(cat.toLowerCase())
          );
          if (found) {
            matchedCategory = found;
            break;
          }
        }
      }
    }

    // Extract time period
    let startDate: Date | undefined = undefined;
    let endDate: Date = new Date();
    let periodLabel = "";

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Check for specific time periods - check more specific ones first
    if (lowerQuery.includes("today")) {
      startDate = today;
      endDate = today;
      periodLabel = "Today";
    } else if (lowerQuery.includes("yesterday")) {
      const yesterday = subDays(today, 1);
      startDate = yesterday;
      endDate = yesterday;
      periodLabel = "Yesterday";
    } else if (lowerQuery.includes("this week")) {
      const dayOfWeek = now.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = subDays(today, daysFromMonday);
      endDate = today;
      periodLabel = "This Week";
    } else if (lowerQuery.includes("last week")) {
      const dayOfWeek = now.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const lastWeekEnd = subDays(today, daysFromMonday + 1);
      const lastWeekStart = subDays(lastWeekEnd, 6);
      startDate = lastWeekStart;
      endDate = lastWeekEnd;
      periodLabel = "Last Week";
    } else if (lowerQuery.includes("last 7 days") || lowerQuery.includes("past 7 days")) {
      startDate = subDays(today, 7);
      endDate = today;
      periodLabel = "Last 7 Days";
    } else if (lowerQuery.includes("last 30 days") || lowerQuery.includes("past 30 days")) {
      startDate = subDays(today, 30);
      endDate = today;
      periodLabel = "Last 30 Days";
    } else if (lowerQuery.includes("last 6 month") || lowerQuery.includes("last 6 months")) {
      startDate = subMonths(today, 6);
      endDate = today;
      periodLabel = "Last 6 Months";
    } else if (lowerQuery.includes("last 3 month") || lowerQuery.includes("last 3 months")) {
      startDate = subMonths(today, 3);
      endDate = today;
      periodLabel = "Last 3 Months";
    } else if (lowerQuery.includes("last month")) {
      const lastMonth = subMonths(now, 1);
      startDate = startOfMonth(lastMonth);
      endDate = endOfMonth(lastMonth);
      periodLabel = "Last Month";
    } else if (lowerQuery.includes("this month")) {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      periodLabel = "This Month";
    } else if (lowerQuery.includes("this year")) {
      startDate = startOfYear(now);
      endDate = endOfYear(now);
      periodLabel = "This Year";
    } else if (lowerQuery.includes("last year")) {
      const lastYear = now.getFullYear() - 1;
      startDate = new Date(lastYear, 0, 1);
      endDate = new Date(lastYear, 11, 31);
      periodLabel = "Last Year";
    } else {
      // Default to last 6 months if no period specified
      startDate = subMonths(today, 6);
      endDate = today;
      periodLabel = "Last 6 Months";
    }

    const filters: any = {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    };

    if (type) {
      filters.type = type;
    }

    const queryInfo: QueryResult = {
      total: 0,
      count: 0,
      type: type || "both",
      category: matchedCategory,
      period: periodLabel,
      query: userQuery,
    };

    return { filters, queryInfo };
  };

  // Fetch transactions based on parsed query
  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ["transactions", parsedQuery ? parsedQuery.query : ""],
    queryFn: () => {
      if (!parsedQuery) return Promise.resolve([]);
      const categoryNames = categories.map(c => c.name);
      const parseResult = parseQuery(parsedQuery.query, categoryNames);
      if (!parseResult) return Promise.resolve([]);
      return getTransactions(parseResult.filters);
    },
    enabled: !!parsedQuery && categories.length > 0,
  });

  // Calculate result when transactions are loaded
  const result = parsedQuery ? (() => {
    let filteredTransactions = transactions;

    // Filter by category if specified - use exact match only
    if (parsedQuery.category) {
      filteredTransactions = transactions.filter(t => {
        const transactionCategory = t.category.toLowerCase().trim();
        const queryCategory = parsedQuery.category!.toLowerCase().trim();
        // Use exact match only to avoid false positives
        return transactionCategory === queryCategory;
      });
    }

    // Calculate total
    const total = filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const count = filteredTransactions.length;

    return {
      ...parsedQuery,
      total,
      count,
    };
  })() : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error("Please enter a query");
      return;
    }

    setIsProcessing(true);
    const categoryNames = categories.map(c => c.name);
    const parseResult = parseQuery(query, categoryNames);
    
    if (!parseResult) {
      toast.error("Could not understand your query. Please try rephrasing.");
      setIsProcessing(false);
      return;
    }

    setParsedQuery(parseResult.queryInfo);
    setIsProcessing(false);
    setTimeout(() => refetch(), 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-card-foreground flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Summary
          </h1>
          <p className="text-sm text-muted-foreground">
            Ask questions about your finances in natural language
          </p>
        </div>

        {/* Query Input */}
        <Card className="mb-8 rounded-2xl shadow-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Ask a Question</CardTitle>
            <CardDescription>
              Examples: "How much I spent on Poland rent in last 6 months" or "Total expenses this month"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="e.g., How much I spent on Poland rent in last 6 months?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 h-11 rounded-xl border-input bg-background shadow-sm"
                />
                <Button
                  type="submit"
                  disabled={isProcessing || !query.trim()}
                  className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-white px-6"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className="rounded-2xl shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Result</CardTitle>
              <CardDescription>
                {result.period} {result.category && `• ${result.category}`} {result.type !== "both" && `• ${result.type}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 rounded-xl bg-muted/50">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                      <p className="text-3xl font-bold text-foreground">
                        {formatCurrency(result.total)}
                      </p>
                    </div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                      {result.type === "expense" ? (
                        <TrendingDown className="h-8 w-8 text-red-600" />
                      ) : result.type === "income" ? (
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      ) : (
                        <Sparkles className="h-8 w-8 text-primary" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-background border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Transactions</p>
                      <p className="text-xl font-semibold text-foreground">{result.count}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-background border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Average</p>
                      <p className="text-xl font-semibold text-foreground">
                        {result.count > 0 ? formatCurrency(result.total / result.count) : formatCurrency(0)}
                      </p>
                    </div>
                  </div>

                  {result.count === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      No transactions found matching your query.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Example Queries */}
        {!result && (
          <Card className="rounded-2xl shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Example Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div 
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => setQuery("How much I spent on Poland rent in last 6 months")}
                >
                  <p className="text-sm font-medium">How much I spent on Poland rent in last 6 months</p>
                </div>
                <div 
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => setQuery("Total expenses this month")}
                >
                  <p className="text-sm font-medium">Total expenses this month</p>
                </div>
                <div 
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => setQuery("How much I earned last month")}
                >
                  <p className="text-sm font-medium">How much I earned last month</p>
                </div>
                <div 
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => setQuery("Total groceries spending in last 3 months")}
                >
                  <p className="text-sm font-medium">Total groceries spending in last 3 months</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

