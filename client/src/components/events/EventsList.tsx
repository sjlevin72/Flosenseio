import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { WaterUsageData, WaterEvent } from "@/types/water";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface EventsListProps {
  timeRange: string;
  isLoading: boolean;
  data?: WaterUsageData;
}

export default function EventsList({
  timeRange,
  isLoading,
  data,
}: EventsListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 4;
  
  // Get event icon and class by category
  const getEventIcon = (category: string) => {
    switch(category) {
      case "shower": return { icon: "shower", color: "text-blue-500" };
      case "washing_machine": return { icon: "wash", color: "text-green-500" };
      case "dishwasher": return { icon: "countertops", color: "text-purple-500" };
      case "faucet": return { icon: "faucet", color: "text-yellow-500" };
      case "toilet": return { icon: "wc", color: "text-teal-500" };
      case "anomaly": return { icon: "warning", color: "text-red-500" };
      default: return { icon: "help_outline", color: "text-neutral-500" };
    }
  };
  
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="mb-4">
          <Skeleton className="h-6 w-48" />
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  {['Time', 'Category', 'Duration', 'Volume', 'Flow Rate', 'Actions'].map((header, i) => (
                    <th key={i} scope="col" className="px-6 py-3 text-left">
                      <Skeleton className="h-4 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(4)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <Skeleton className="h-5 w-24" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-neutral-50 px-4 py-3 border-t border-neutral-200">
            <Skeleton className="h-8 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  const events = data?.events || [];
  
  // Pagination
  const totalPages = Math.ceil(events.length / eventsPerPage);
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = events.slice(indexOfFirstEvent, indexOfLastEvent);
  
  const handleChangePage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-neutral-900 mb-4">Recent Water Usage Events</h2>
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Volume
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Flow Rate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {currentEvents.length > 0 ? (
                currentEvents.map((event: WaterEvent, index: number) => {
                  const { icon, color } = getEventIcon(event.category);
                  return (
                    <tr key={index} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {event.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`material-icons ${color} mr-2`}>{icon}</span>
                          <span className="text-sm font-medium">
                            {event.category.charAt(0).toUpperCase() + 
                             event.category.slice(1).replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 font-mono">
                        {event.duration}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 font-mono">
                        {event.volume} L
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 font-mono">
                        {event.flowRate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link href={`/events/${event.id}`}>
                          <Button variant="link" className="text-primary hover:text-primary-dark p-0">
                            View Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-neutral-500">
                    No water usage events found for the selected time period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {events.length > 0 && (
          <div className="bg-neutral-50 px-4 py-3 border-t border-neutral-200 sm:px-6 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleChangePage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleChangePage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-neutral-700">
                  Showing <span className="font-medium">{indexOfFirstEvent + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastEvent, events.length)}
                  </span>{" "}
                  of <span className="font-medium">{events.length}</span> events
                </p>
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handleChangePage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    let pageNumber;
                    
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                      if (i === 4) return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                      if (i === 0) return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    } else {
                      if (i === 0) return (
                        <PaginationItem key={i}>
                          <PaginationLink onClick={() => handleChangePage(1)}>1</PaginationLink>
                        </PaginationItem>
                      );
                      if (i === 1) return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                      if (i === 3) return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                      if (i === 4) return (
                        <PaginationItem key={i}>
                          <PaginationLink onClick={() => handleChangePage(totalPages)}>{totalPages}</PaginationLink>
                        </PaginationItem>
                      );
                      pageNumber = currentPage + (i - 2);
                    }
                    
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => handleChangePage(pageNumber)}
                          isActive={currentPage === pageNumber}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handleChangePage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
