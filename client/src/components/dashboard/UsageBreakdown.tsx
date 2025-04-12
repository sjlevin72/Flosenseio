import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WaterUsageData, UsageCategory } from "@/types/water";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface UsageBreakdownProps {
  timeRange: string;
  isLoading: boolean;
  data?: WaterUsageData;
}

// Category colors mapping
const COLORS = {
  shower: "#3B82F6",       // Blue
  washing_machine: "#059669", // Green
  dishwasher: "#8B5CF6",   // Purple
  faucet: "#F59E0B",       // Yellow
  other: "#6B7280",        // Gray
  toilet: "#14B8A6",       // Teal
  irrigation: "#10B981",   // Emerald
  bath: "#60A5FA",         // Light Blue
  leak: "#EF4444",         // Red
};

// Category icons mapping
const ICONS = {
  shower: "shower",
  washing_machine: "wash",
  dishwasher: "countertops",
  faucet: "faucet",
  other: "help_outline",
  toilet: "wc",
  irrigation: "sprinkler",
  bath: "bathtub",
  leak: "warning",
};

export default function UsageBreakdown({
  timeRange,
  isLoading,
  data,
}: UsageBreakdownProps) {
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[220px] w-full" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for pie chart
  const chartData = data?.categories?.map((category: UsageCategory) => ({
    name: category.name,
    value: parseFloat(category.percentage),
    color: COLORS[category.name as keyof typeof COLORS] || COLORS.other,
    icon: ICONS[category.name as keyof typeof ICONS] || ICONS.other,
    volume: category.volume,
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div style={{ height: "220px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Usage']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Category Table */}
          <div className="overflow-auto" style={{ maxHeight: "220px" }}>
            <table className="min-w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider py-2 px-4">Category</th>
                  <th className="text-right text-xs font-medium text-neutral-500 uppercase tracking-wider py-2 px-4">Volume</th>
                  <th className="text-right text-xs font-medium text-neutral-500 uppercase tracking-wider py-2 px-4">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {chartData.map((category, index) => (
                  <tr key={index} className="hover:bg-neutral-50">
                    <td className="py-2 px-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="material-icons text-sm mr-2" style={{ color: category.color }}>{category.icon}</span>
                        <span className="text-sm font-medium">{category.name.charAt(0).toUpperCase() + category.name.slice(1).replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap text-sm text-right font-mono">{category.volume} L</td>
                    <td className="py-2 px-4 whitespace-nowrap text-sm text-right">{category.value.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
