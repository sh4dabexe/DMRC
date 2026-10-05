import { NextResponse } from 'next/server';
import faresData from '@/data/fares.json';

export async function GET() {
  return NextResponse.json(faresData);
}
