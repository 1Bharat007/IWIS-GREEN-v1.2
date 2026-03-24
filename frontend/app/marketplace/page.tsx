"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

type Listing = {
  listingId: string;
  category: string;
  confidence: number;
  co2: number;
  timestamp: string;
  imageHash: string;
  ownerEmail: string;
  status: string;
  priceRange: string;
  createdAt: string;
  bids?: Bid[];
};

type Bid = {
  bidId: string;
  offerAmount: number;
  status: string;
  createdAt: string;
  bidderEmail: string;
};

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<"Feed" | "MyListings">("Feed");
  const [feed, setFeed] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Bid placement state
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState("");

  const loadMarketplace = async () => {
    setLoading(true);
    try {
      if (activeTab === "Feed") {
        const data = await apiFetch("/marketplace");
        setFeed(data);
      } else {
        const data = await apiFetch("/marketplace/my-listings");
        setMyListings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplace();
  }, [activeTab]);

  const handlePlaceBid = async (listingId: string) => {
    if (!bidAmount) return;
    try {
      await apiFetch(`/marketplace/${listingId}/bid`, {
        method: "POST",
        body: JSON.stringify({ offerAmount: bidAmount })
      });
      alert("Bid placed successfully!");
      setSelectedListing(null);
      setBidAmount("");
      loadMarketplace();
    } catch (err: any) {
      alert(err.message || "Failed to place bid");
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    try {
      await apiFetch(`/marketplace/bid/${bidId}/accept`, {
        method: "POST"
      });
      alert("Bid accepted! The smart-contract flow will initiate.");
      loadMarketplace();
    } catch (err: any) {
      alert(err.message || "Failed to accept bid");
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-semibold tracking-tight">Circular Exchange</h1>
          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab("Feed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "Feed" ? "bg-white dark:bg-neutral-900 shadow-sm" : "text-neutral-500"}`}
            >
              Market Feed
            </button>
            <button 
              onClick={() => setActiveTab("MyListings")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "MyListings" ? "bg-white dark:bg-neutral-900 shadow-sm" : "text-neutral-500"}`}
            >
              My Listings
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-neutral-500">Syncing with blockchain ledger...</div>
        ) : activeTab === "Feed" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feed.length === 0 ? (
              <div className="col-span-full py-20 text-center text-neutral-500 bg-white dark:bg-[#1E293B] rounded-2xl border border-neutral-200 dark:border-neutral-800">
                No active waste listings right now.
              </div>
            ) : (
              feed.map((listing) => (
                <div key={listing.listingId} className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                      {listing.category}
                    </span>
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      Est. ₹{listing.priceRange}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-6 flex-1">
                    <p className="text-sm text-neutral-500">Listed by <span className="text-neutral-900 dark:text-white font-medium">{listing.ownerEmail.split('@')[0]}</span></p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 flex justify-between">
                      <span>Carbon Value:</span>
                      <span className="font-mono">{listing.co2} kg CO₂e</span>
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 flex justify-between">
                      <span>Status:</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">{listing.status}</span>
                    </p>
                  </div>

                  {selectedListing === listing.listingId ? (
                    <div className="flex gap-2">
                       <input 
                         type="number"
                         value={bidAmount}
                         onChange={e => setBidAmount(e.target.value)}
                         placeholder="Offer ₹" 
                         className="flex-1 bg-neutral-100 dark:bg-neutral-800 border-none rounded-lg px-3 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                       />
                       <button onClick={() => handlePlaceBid(listing.listingId)} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium">Sumit Bid</button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setSelectedListing(listing.listingId)}
                      className="w-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-sm font-medium py-3 rounded-xl transition"
                    >
                      Place Bid
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {myListings.length === 0 ? (
              <div className="py-20 text-center text-neutral-500 bg-white dark:bg-[#1E293B] rounded-2xl border border-neutral-200 dark:border-neutral-800">
                You haven't listed any of your scanned waste yet.
              </div>
            ) : (
              myListings.map((listing) => (
                <div key={listing.listingId} className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-3 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 pb-6 md:pb-0 md:pr-6">
                    <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                      {listing.category}
                    </span>
                    <h3 className="font-medium text-lg mt-2">Listing Reference: <span className="font-mono text-sm">{listing.listingId.split('-')[0]}</span></h3>
                    <div className="text-sm text-neutral-500 space-y-1">
                      <p>Expected Value: ₹{listing.priceRange}</p>
                      <p>Impact: {listing.co2} kg CO₂e Saved</p>
                      <p>Status: <strong className={listing.status === 'Assigned' ? 'text-green-500' : 'text-blue-500'}>{listing.status}</strong></p>
                    </div>
                  </div>

                  <div className="flex-[2]">
                    <h4 className="font-medium text-sm mb-4 uppercase tracking-wider text-neutral-500">Bids Received</h4>
                    {(!listing.bids || listing.bids.length === 0) ? (
                      <p className="text-sm text-neutral-400 italic">Waiting for recyclers to place offers...</p>
                    ) : (
                      <div className="space-y-3">
                        {listing.bids.map(bid => (
                          <div key={bid.bidId} className={`flex items-center justify-between p-3 rounded-xl border ${bid.status === 'Accepted' ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-neutral-200 dark:border-neutral-800'}`}>
                            <div>
                               <p className="font-medium text-sm">₹{bid.offerAmount}</p>
                               <p className="text-xs text-neutral-500">From: {bid.bidderEmail}</p>
                            </div>
                            {listing.status === 'Open' ? (
                               <button 
                                 onClick={() => handleAcceptBid(bid.bidId)}
                                 className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-lg text-xs font-medium hover:opacity-80 transition"
                               >
                                 Accept Offer
                               </button>
                            ) : (
                               <span className={`text-xs font-medium px-3 py-1 rounded-full ${bid.status === 'Accepted' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                                 {bid.status}
                               </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
