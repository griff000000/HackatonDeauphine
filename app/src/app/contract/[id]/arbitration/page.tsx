"use client";

import React from "react";
import ArbitrationView from "@/components/ArbitrationView";

export default function ArbitrationPage({ params }: { params: { id: string } }) {
  // In a real app we'd fetch the contract dispute data based on params.id
  // We pass the ID to the view
  return <ArbitrationView contractId={params.id} />;
}
