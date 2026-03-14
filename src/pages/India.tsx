import { useState, useMemo, useEffect } from "react";
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, MapPin, Calendar, Edit2, Trash2, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrencyEntries, createCurrencyEntry, updateCurrencyEntry, deleteCurrencyEntry } from "@/lib/currency-entries";
import { getCategories } from "@/lib/categories";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import { cn, capitalizeFirst } from "@/lib/utils";
import { formatPLN, formatINR } from "@/lib/currency-format";
import { toast } from "sonner";
import type { CurrencyEntry } from "@/types/currency-entry";
import { CategoryIcon } from "@/components/CategoryIcon";

type DateFilterType = "this-month" | "last-month" | "this-year" | "custom";

export default function India() {
  const [dateFilter, setDateFilter] = useState<DateFilterType>("this-year");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  
  // Form state
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formPlnAmount, setFormPlnAmount] = useState("");
  const [formInrAmount, setFormInrAmount] = useState("");
  const [editingEntry, setEditingEntry] = useState<CurrencyEntry | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pln");
  
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  // Open popover when custom date filter is selected (only if dates are not set)
  useEffect(() => {
    if (dateFilter === "custom" && !isCustomDateOpen && (!customStartDate || !customEndDate)) {
      // Small delay to ensure dropdown closes first
      const timer = setTimeout(() => {
        setIsCustomDateOpen(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [dateFilter]);

  // Calculate date range based on filter type
  const dateRange = useMemo(() => {
    const now = new Date();
    
    switch (dateFilter) {
      case "this-month":
        return {
          start: format(startOfMonth(now), "yyyy-MM-dd"),
          end: format(endOfMonth(now), "yyyy-MM-dd"),
          label: "This Month",
        };
      case "last-month":
        const lastMonth = subMonths(now, 1);
        return {
          start: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
          end: format(endOfMonth(lastMonth), "yyyy-MM-dd"),
          label: "Last Month",
        };
      case "this-year":
        return {
          start: format(startOfYear(now), "yyyy-MM-dd"),
          end: format(endOfYear(now), "yyyy-MM-dd"),
          label: "This Year",
        };
      case "custom":
        if (customStartDate && customEndDate) {
          return {
            start: format(customStartDate, "yyyy-MM-dd"),
            end: format(customEndDate, "yyyy-MM-dd"),
            label: `${format(customStartDate, "MMM dd")} - ${format(customEndDate, "MMM dd, yyyy")}`,
          };
        }
        return {
          start: format(startOfMonth(now), "yyyy-MM-dd"),
          end: format(endOfMonth(now), "yyyy-MM-dd"),
          label: "Custom Date",
        };
      default:
        return {
          start: format(startOfMonth(now), "yyyy-MM-dd"),
          end: format(endOfMonth(now), "yyyy-MM-dd"),
          label: "This Month",
        };
    }
  }, [dateFilter, customStartDate, customEndDate]);

  // Fetch currency entries
  const { data: currencyEntries = [], isLoading: isLoadingEntries } = useQuery({
    queryKey: ["currency-entries", { startDate: dateRange.start, endDate: dateRange.end }],
    queryFn: () => getCurrencyEntries({ startDate: dateRange.start, endDate: dateRange.end }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createCurrencyEntry,
    onSuccess: (data, variables) => {
      toast.success("Currency entry added successfully!");
      
      // Check if the added entry's date is outside the current filter range
      const entryDate = new Date(variables.date + 'T00:00:00'); // Add time to avoid timezone issues
      const currentStart = new Date(dateRange.start + 'T00:00:00');
      const currentEnd = new Date(dateRange.end + 'T23:59:59');
      
      // If entry date is outside current filter range, adjust the filter
      if (entryDate < currentStart || entryDate > currentEnd) {
        const entryMonth = entryDate.getMonth();
        const entryYear = entryDate.getFullYear();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // If entry is from last month, switch to "last-month" filter
        if (entryYear === currentYear && entryMonth === currentMonth - 1) {
          setDateFilter("last-month");
        } 
        // If entry is from this year but different month, switch to "this-year" filter
        else if (entryYear === currentYear) {
          setDateFilter("this-year");
        }
        // Otherwise, set custom date range to include the entry's month
        else {
          setDateFilter("custom");
          const entryStartOfMonth = new Date(entryYear, entryMonth, 1);
          const entryEndOfMonth = new Date(entryYear, entryMonth + 1, 0);
          setCustomStartDate(entryStartOfMonth);
          setCustomEndDate(entryEndOfMonth);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["currency-entries"] });
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to add entry: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { date: string; description: string; category?: string; pln_amount: number; inr_amount: number } }) =>
      updateCurrencyEntry(id, data),
    onSuccess: () => {
      toast.success("Currency entry updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["currency-entries"] });
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update entry: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCurrencyEntry,
    onSuccess: () => {
      toast.success("Currency entry deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["currency-entries"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete entry: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormDescription("");
    setFormCategory("");
    setFormPlnAmount("");
    setFormInrAmount("");
    setEditingEntry(null);
    setIsEditMode(false);
  };

  const handleEdit = (entry: CurrencyEntry) => {
    setEditingEntry(entry);
    setFormDate(entry.date);
    setFormDescription(entry.description);
    setFormCategory(entry.category || "");
    setFormPlnAmount(entry.pln_amount.toString());
    setFormInrAmount(entry.inr_amount.toString());
    setIsEditMode(true);
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      resetForm();
    } else {
      setIsEditMode(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formDescription || !formPlnAmount || !formInrAmount) {
      toast.error("Please fill in all fields");
      return;
    }

    const plnAmount = parseFloat(formPlnAmount);
    const inrAmount = parseFloat(formInrAmount);

    if (isNaN(plnAmount) || isNaN(inrAmount)) {
      toast.error("Please enter valid amounts");
      return;
    }

    if (editingEntry) {
      updateMutation.mutate({
        id: editingEntry.id,
        data: {
          date: formDate,
          description: formDescription,
          category: formCategory || undefined,
          pln_amount: plnAmount,
          inr_amount: inrAmount,
        },
      });
    } else {
      createMutation.mutate({
        date: formDate,
        description: formDescription,
        category: formCategory || undefined,
        pln_amount: plnAmount,
        inr_amount: inrAmount,
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      deleteMutation.mutate(id);
    }
  };

  // Calculate metrics from currency entries
  const metrics = useMemo(() => {
    const totalPln = currencyEntries.reduce((sum, entry) => sum + parseFloat(entry.pln_amount.toString()), 0);
    const totalInr = currencyEntries.reduce((sum, entry) => sum + parseFloat(entry.inr_amount.toString()), 0);
    
    return { 
      totalPln, 
      totalInr, 
      count: currencyEntries.length 
    };
  }, [currencyEntries]);

  // Prepare chart data for PLN breakdown by category
  const plnBreakdown = useMemo(() => {
    const categoryMap = new Map<string, number>();

    currencyEntries.forEach((entry) => {
      const category = entry.category || "Uncategorized";
      const current = categoryMap.get(category) || 0;
      categoryMap.set(category, current + parseFloat(entry.pln_amount.toString()));
    });

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount: Number(amount.toFixed(2)),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [currencyEntries]);

  // Prepare chart data for INR breakdown by category
  const inrBreakdown = useMemo(() => {
    const categoryMap = new Map<string, number>();

    currencyEntries.forEach((entry) => {
      const category = entry.category || "Uncategorized";
      const current = categoryMap.get(category) || 0;
      categoryMap.set(category, current + parseFloat(entry.inr_amount.toString()));
    });

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount: Number(amount.toFixed(2)),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [currencyEntries]);

  // Recent entries (filtered and sorted)
  const recentEntries = useMemo(() => {
    return currencyEntries
      .filter((entry) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          !searchQuery ||
          entry.description?.toLowerCase().includes(searchLower) ||
          entry.category?.toLowerCase().includes(searchLower)
        );
      })
      .slice(0, 10)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [currencyEntries, searchQuery]);

  const getCategoryColor = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes("rent")) return "#14b8a6";
    if (lower.includes("food")) return "#3b82f6";
    if (lower.includes("transport")) return "#ef4444";
    if (lower.includes("utilities")) return "#f59e0b";
    return "#8b5cf6";
  };

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color?: string }> = {
      amount: {
        label: "Amount",
      },
    };

    plnBreakdown.forEach((item) => {
      config[item.category] = {
        label: item.category,
        color: getCategoryColor(item.category),
      };
    });

    inrBreakdown.forEach((item) => {
      config[item.category] = {
        label: item.category,
        color: getCategoryColor(item.category),
      };
    });

    return config;
  }, [plnBreakdown, inrBreakdown]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = format(date, "MMMM");
      const year = date.getFullYear();
      
      // Add ordinal suffix (st, nd, rd, th)
      const getOrdinalSuffix = (day: number) => {
        if (day > 3 && day < 21) return "th";
        switch (day % 10) {
          case 1: return "st";
          case 2: return "nd";
          case 3: return "rd";
          default: return "th";
        }
      };
      
      return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6 lg:py-8 sm:px-6 lg:px-8 w-full overflow-x-hidden">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8 flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-card-foreground flex items-center gap-2 font-sans">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                India Currency Entries
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Track your PLN and INR currency conversions
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
            {dateFilter === "custom" ? (
              <Popover open={isCustomDateOpen} onOpenChange={(open) => {
                setIsCustomDateOpen(open);
                // If closing and no dates selected, reset to default filter
                if (!open && !customStartDate && !customEndDate) {
                  setDateFilter("this-year");
                }
              }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="rounded-xl gap-2 w-full sm:w-auto text-xs sm:text-sm">
                    <span className="truncate">{dateRange.label}</span>
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 rounded-xl" 
                  align="end"
                >
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Date</label>
                      <CalendarComponent
                        mode="single"
                        selected={customStartDate}
                        onSelect={(date) => {
                          setCustomStartDate(date);
                          if (date && customEndDate && date > customEndDate) {
                            setCustomEndDate(undefined);
                          }
                        }}
                        className="rounded-md border"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Date</label>
                      <CalendarComponent
                        mode="single"
                        selected={customEndDate}
                        onSelect={(date) => {
                          if (date && customStartDate && date < customStartDate) {
                            return;
                          }
                          setCustomEndDate(date);
                          // Close popover after both dates are selected
                          if (date && customStartDate) {
                            setTimeout(() => {
                              setIsCustomDateOpen(false);
                            }, 100);
                          }
                        }}
                        disabled={(date) => customStartDate ? date < customStartDate : false}
                        className="rounded-md border"
                      />
                    </div>
                    {customStartDate && customEndDate && (
                      <Button
                        onClick={() => setIsCustomDateOpen(false)}
                        className="w-full"
                      >
                        Apply Filter
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-xl gap-2 w-full sm:w-auto text-xs sm:text-sm">
                    <span className="truncate">{dateRange.label}</span>
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem
                    onClick={() => {
                      setDateFilter("this-month");
                      setCustomStartDate(undefined);
                      setCustomEndDate(undefined);
                    }}
                    className="rounded-lg"
                  >
                    This Month
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setDateFilter("last-month");
                      setCustomStartDate(undefined);
                      setCustomEndDate(undefined);
                    }}
                    className="rounded-lg"
                  >
                    Last Month
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setDateFilter("this-year");
                      setCustomStartDate(undefined);
                      setCustomEndDate(undefined);
                    }}
                    className="rounded-lg"
                  >
                    This Year
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setDateFilter("custom");
                      setIsCustomDateOpen(true);
                    }}
                    className="rounded-lg"
                  >
                    Custom Date
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="mb-4 sm:mb-6 lg:mb-8 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
          {/* Total PLN */}
          <Card className="rounded-2xl shadow-card">
            <CardHeader className="pb-2 sm:pb-3">
              <CardDescription className="text-xs sm:text-sm">Total PLN</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-lg sm:text-xl font-semibold text-foreground truncate">
                    {formatPLN(metrics.totalPln)} PLN
                  </p>
                  <p className="mt-1 sm:mt-2 flex items-center gap-1 text-xs sm:text-sm font-medium text-blue-600">
                    <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate">Polish Zloty</span>
                  </p>
                </div>
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-blue-100 shrink-0 ml-2">
                  <ArrowUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total INR */}
          <Card className="rounded-2xl shadow-card">
            <CardHeader className="pb-2 sm:pb-3">
              <CardDescription className="text-xs sm:text-sm">Total INR</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-lg sm:text-xl font-semibold text-foreground truncate">
                    {formatINR(metrics.totalInr)} INR
                  </p>
                  <p className="mt-1 sm:mt-2 flex items-center gap-1 text-xs sm:text-sm font-medium text-orange-600">
                    <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate">Indian Rupee</span>
                  </p>
                </div>
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-orange-100 shrink-0 ml-2">
                  <ArrowDown className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview Dashboard */}
        <Card className="mb-4 sm:mb-6 lg:mb-8 rounded-2xl shadow-card">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Financial Overview</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Track your PLN and INR amounts by category</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex rounded-xl bg-muted p-1 w-full">
                <TabsTrigger 
                  value="pln" 
                  className={cn(
                    "flex-1 rounded-lg py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all",
                    "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
                  )}
                >
                  PLN Breakdown
                </TabsTrigger>
                <TabsTrigger 
                  value="inr" 
                  className={cn(
                    "flex-1 rounded-lg py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all",
                    "data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
                  )}
                >
                  INR Breakdown
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pln" className="mt-4 sm:mt-6">
                {plnBreakdown.length > 0 ? (
                  <>
                    <div className="mb-3 sm:mb-4 flex flex-wrap gap-2 sm:gap-4">
                      {plnBreakdown.map((item) => (
                        <div key={item.category} className="flex items-center gap-1.5 sm:gap-2">
                          <div
                            className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full shrink-0"
                            style={{ backgroundColor: getCategoryColor(item.category) }}
                          />
                          <span className="text-xs sm:text-sm text-muted-foreground truncate">
                            {capitalizeFirst(item.category)}: {formatPLN(item.amount)} PLN
                          </span>
                        </div>
                      ))}
                    </div>
                    <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] lg:h-[300px] w-full">
                      <ResponsiveContainer>
                        <BarChart data={plnBreakdown.map(item => ({ ...item, category: capitalizeFirst(item.category) }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar 
                            dataKey="amount" 
                            radius={[8, 8, 0, 0]}
                          >
                            {plnBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    No PLN data available
                  </div>
                )}
              </TabsContent>

              <TabsContent value="inr" className="mt-4 sm:mt-6">
                {inrBreakdown.length > 0 ? (
                  <>
                    <div className="mb-3 sm:mb-4 flex flex-wrap gap-2 sm:gap-4">
                      {inrBreakdown.map((item) => (
                        <div key={item.category} className="flex items-center gap-1.5 sm:gap-2">
                          <div
                            className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full shrink-0"
                            style={{ backgroundColor: getCategoryColor(item.category) }}
                          />
                          <span className="text-xs sm:text-sm text-muted-foreground truncate">
                            {capitalizeFirst(item.category)}: {formatINR(item.amount)} INR
                          </span>
                        </div>
                      ))}
                    </div>
                    <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] lg:h-[300px] w-full">
                      <ResponsiveContainer>
                        <BarChart data={inrBreakdown.map(item => ({ ...item, category: capitalizeFirst(item.category) }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar 
                            dataKey="amount" 
                            radius={[8, 8, 0, 0]}
                          >
                            {inrBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    No INR data available
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Currency Entries */}
        <Card className="mb-4 sm:mb-6 lg:mb-8 rounded-2xl shadow-card">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Recent Currency Entries</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Your latest currency transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-4 sm:mb-6">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 sm:h-11 rounded-xl border-input bg-background pl-9 sm:pl-10 shadow-sm text-sm sm:text-base"
              />
            </div>

            {/* Entry List */}
            {isLoadingEntries ? (
              <div className="py-12 text-center text-muted-foreground">
                Loading entries...
              </div>
            ) : recentEntries.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {recentEntries.map((entry) => {
                  const category = categories.find(cat => cat.name === entry.category);
                  
                  return (
                    <div
                      key={entry.id}
                      className="group flex items-center gap-3 sm:gap-4 rounded-xl border border-border bg-background p-3 sm:p-4 transition-all hover:border-primary/20 hover:shadow-sm"
                    >
                      {/* Icon */}
                      <div className="flex h-12 w-12 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                        {category ? (
                          <CategoryIcon iconName={category.icon} size={20} />
                        ) : (
                          <MapPin className="h-5 w-5 sm:h-5 sm:w-5" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <p className="font-medium text-foreground text-sm sm:text-base line-clamp-2 break-words">
                          {entry.category ? capitalizeFirst(entry.category) : "Uncategorized"}
                        </p>
                        <div className="flex flex-col gap-0.5">
                          {entry.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {entry.description}
                            </p>
                          )}
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {formatDate(entry.date)}
                          </p>
                        </div>
                      </div>

                      {/* Amount & Actions */}
                      <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3 shrink-0">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm sm:text-base font-semibold whitespace-nowrap text-blue-600">
                            {formatPLN(entry.pln_amount)} PLN
                          </span>
                          <span className="text-sm sm:text-base font-semibold whitespace-nowrap text-orange-600">
                            {formatINR(entry.inr_amount)} INR
                          </span>
                        </div>

                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEdit(entry)}
                          >
                            <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-red-600"
                            onClick={() => handleDelete(entry.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No entries found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Currency Entry Form */}
        <Card className="mb-4 sm:mb-6 lg:mb-8 rounded-2xl shadow-card">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold font-sans">Add Currency Entry</CardTitle>
            <CardDescription className="text-xs sm:text-sm font-sans">Enter PLN and INR amounts for India transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Date Picker */}
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative w-full">
                      <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input
                        type="text"
                        placeholder="Pick a date"
                        value={format(new Date(formDate), "MMM dd, yyyy")}
                        readOnly
                        onClick={() => setIsDatePickerOpen(true)}
                        className="h-10 sm:h-11 rounded-xl border-input bg-background pl-9 sm:pl-10 shadow-sm cursor-pointer text-sm sm:text-base"
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl" align="start" sideOffset={4}>
                    <CalendarComponent
                      mode="single"
                      selected={new Date(formDate)}
                      onSelect={(date) => {
                        if (date) {
                          setFormDate(format(date, "yyyy-MM-dd"));
                          setIsDatePickerOpen(false);
                        }
                      }}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>

                {/* Description */}
                <Input
                  type="text"
                  placeholder="Description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full h-10 sm:h-11 rounded-xl border-input bg-background shadow-sm text-sm sm:text-base"
                  required
                />

                {/* Category */}
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="w-full h-10 sm:h-11 rounded-xl border-input bg-background shadow-sm text-sm sm:text-base">
                    <SelectValue placeholder="Category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        <div className="flex items-center gap-2">
                          <CategoryIcon iconName={cat.icon} size={16} />
                          <span className="text-sm">{cat.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* PLN Amount */}
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Amount (PLN)"
                  value={formPlnAmount}
                  onChange={(e) => setFormPlnAmount(e.target.value)}
                  className="w-full h-10 sm:h-11 rounded-xl border-input bg-background shadow-sm text-sm sm:text-base"
                  required
                />

                {/* INR Amount */}
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Amount (INR)"
                  value={formInrAmount}
                  onChange={(e) => setFormInrAmount(e.target.value)}
                  className="w-full h-10 sm:h-11 rounded-xl border-input bg-background shadow-sm text-sm sm:text-base"
                  required
                />

                {/* Buttons Row */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* Add Button */}
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 h-10 sm:h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base whitespace-nowrap"
                  >
                    {editingEntry ? "UPDATE" : "ADD"}
                  </Button>

                  {/* Edit Mode Toggle Button */}
                  <Button
                    type="button"
                    onClick={toggleEditMode}
                    className={cn(
                      "flex-1 sm:flex-initial h-10 sm:h-11 rounded-xl text-white border-0 px-4 sm:px-6 text-sm sm:text-base whitespace-nowrap",
                      isEditMode
                        ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                        : "bg-gray-600 hover:bg-gray-700"
                    )}
                  >
                    {isEditMode ? "CANCEL EDIT" : "EDIT"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Currency Entries Table */}
        <Card className="mb-4 sm:mb-6 lg:mb-8 rounded-2xl shadow-card overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold font-sans">Currency Entries</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingEntries ? (
              <div className="py-8 sm:py-12 text-center text-muted-foreground text-sm sm:text-base">
                Loading entries...
              </div>
            ) : currencyEntries.length > 0 ? (
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <table className="w-full min-w-[600px]">
                  {/* Table Header */}
                  <thead>
                    <tr className="bg-black text-white">
                      <th className="px-2 sm:px-3 lg:px-5 py-2 sm:py-3 lg:py-4 text-left text-[10px] sm:text-xs font-semibold font-sans border-r border-gray-700 min-w-[90px] sm:min-w-[120px] lg:w-48">Date</th>
                      <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 text-left text-[10px] sm:text-xs font-semibold font-sans border-r border-gray-700 min-w-[80px] sm:min-w-[100px]">Description</th>
                      <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 text-left text-[10px] sm:text-xs font-semibold font-sans border-r border-gray-700 min-w-[80px] sm:min-w-[100px] hidden sm:table-cell">Category</th>
                      <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 text-right text-[10px] sm:text-xs font-semibold font-sans border-r border-gray-700 min-w-[90px] sm:min-w-[100px] lg:w-40">PLN</th>
                      <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 text-right text-[10px] sm:text-xs font-semibold font-sans border-r border-gray-700 min-w-[90px] sm:min-w-[100px] lg:w-40">INR</th>
                      {isEditMode && (
                        <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 text-center text-[10px] sm:text-xs font-semibold font-sans min-w-[70px] sm:min-w-[80px] lg:w-24">Actions</th>
                      )}
                    </tr>
                  </thead>
                  {/* Table Body */}
                  <tbody>
                    {currencyEntries.map((entry, index) => (
                      <tr
                        key={entry.id}
                        className={cn(
                          "group border-b border-gray-300 transition-colors hover:bg-muted/50",
                          index % 2 === 0 ? "bg-background" : "bg-muted/30"
                        )}
                      >
                        <td className="px-2 sm:px-3 lg:px-5 py-2 sm:py-3 lg:py-4 text-[10px] sm:text-xs lg:text-sm text-foreground font-sans border-r border-gray-300 min-w-[90px] sm:min-w-[120px] lg:w-48 whitespace-nowrap">
                          <span className="truncate block">{formatDate(entry.date)}</span>
                        </td>
                        <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 text-[10px] sm:text-xs lg:text-sm text-foreground font-sans border-r border-gray-300 min-w-[80px] sm:min-w-[100px]">
                          <div className="max-w-[100px] sm:max-w-[150px] lg:max-w-none break-words overflow-hidden text-ellipsis line-clamp-2">
                            {entry.description}
                          </div>
                          {/* Show category on mobile in description cell */}
                          {entry.category && (
                            <div className="sm:hidden mt-1 flex items-center gap-1">
                              {(() => {
                                const category = categories.find(cat => cat.name === entry.category);
                                return category ? (
                                  <>
                                    <CategoryIcon iconName={category.icon} size={12} />
                                    <span className="text-[9px] text-muted-foreground truncate">{capitalizeFirst(entry.category)}</span>
                                  </>
                                ) : (
                                  <span className="text-[9px] text-muted-foreground truncate">{capitalizeFirst(entry.category)}</span>
                                );
                              })()}
                            </div>
                          )}
                        </td>
                        <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 text-[10px] sm:text-xs lg:text-sm text-foreground font-sans border-r border-gray-300 min-w-[80px] sm:min-w-[100px] hidden sm:table-cell">
                          {entry.category ? (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              {(() => {
                                const category = categories.find(cat => cat.name === entry.category);
                                return category ? (
                                  <>
                                    <CategoryIcon iconName={category.icon} size={14} />
                                    <span className="truncate">{capitalizeFirst(entry.category)}</span>
                                  </>
                                ) : (
                                  <span className="truncate">{capitalizeFirst(entry.category)}</span>
                                );
                              })()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 text-[10px] sm:text-xs lg:text-sm text-foreground text-right font-sans tabular-nums border-r border-gray-300 min-w-[90px] sm:min-w-[100px] lg:w-40 whitespace-nowrap">
                          {formatPLN(entry.pln_amount)}
                        </td>
                        <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 text-[10px] sm:text-xs lg:text-sm text-foreground text-right font-sans tabular-nums border-r border-gray-300 min-w-[90px] sm:min-w-[100px] lg:w-40 whitespace-nowrap">
                          {formatINR(entry.inr_amount)}
                        </td>
                        {isEditMode && (
                          <td className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 text-center min-w-[70px] sm:min-w-[80px] lg:w-24">
                            <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => handleEdit(entry)}
                              >
                                <Edit2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-muted-foreground hover:text-red-600"
                                onClick={() => handleDelete(entry.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 sm:py-12 text-center text-muted-foreground text-sm sm:text-base">
                No currency entries found
              </div>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  );
}

