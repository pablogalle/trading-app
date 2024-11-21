"use client";

import { useState, useEffect, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import axios from "axios";

const initialAssets = [
  { symbol: "AAPL", name: "Apple Inc.", type: "stock" },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock" },
  { symbol: "MSFT", name: "Microsoft Corporation", type: "stock" },
];

export default function Dashboard() {
  const [assets, setAssets] = useState(initialAssets);
  const [selectedAsset, setSelectedAsset] = useState(initialAssets[0]);
  const [data, setData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rangeChange, setRangeChange] = useState(null); // Cambio dentro del rango seleccionado

  const fetchStockData = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const lastYear = new Date();
      lastYear.setFullYear(today.getFullYear() - 1);

      const endDate = today.toISOString().split("T")[0];
      const startDate = lastYear.toISOString().split("T")[0];
      const response = await axios.post("http://127.0.0.1:8000/stocks/", {
        symbol: selectedAsset.symbol,
        start_date: startDate,
        end_date: endDate,
        timeframe: "day",
      });
      const formattedData = response.data.data.map((item) => ({
        time: item.timestamp,
        price: parseFloat(item.close),
      }));

      setData(formattedData);

      if (formattedData.length > 0) {
        const latestPrice = formattedData[formattedData.length - 1].price;
        const initialPrice = formattedData[0].price;
        setCurrentPrice(latestPrice);
        setPriceChange(((latestPrice - initialPrice) / initialPrice * 100).toFixed(2));
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAsset]);

  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

  const handleAssetChange = (value) => {
    setSelectedAsset(assets.find((asset) => asset.symbol === value));
  };

  const handleBrushChange = (startIndex, endIndex) => {
    if (data.length > 0) {
      const startPrice = data[startIndex]?.price || 0;
      const endPrice = data[endIndex]?.price || 0;
      const absoluteChange = endPrice - startPrice;
      const percentageChange = ((absoluteChange / startPrice) * 100).toFixed(2);
      setRangeChange({
        startPrice,
        endPrice,
        absoluteChange: absoluteChange.toFixed(2),
        percentageChange,
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Dashboard de Acciones y Criptomonedas</h1>
      <div className="flex mb-4 space-x-4">
        {/* Selector de activos */}
        <Select onValueChange={handleAssetChange} defaultValue={selectedAsset.symbol}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecciona un activo" />
          </SelectTrigger>
          <SelectContent>
            {assets.map((asset) => (
              <SelectItem key={asset.symbol} value={asset.symbol}>
                {asset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Card className="w-full mb-4">
        <CardHeader>
          <CardTitle>
            {selectedAsset.name} ({selectedAsset.symbol})
          </CardTitle>
          <CardDescription>
            Precio actual: ${currentPrice ? currentPrice.toFixed(2) : "Cargando..."}
            {priceChange && (
              <span className={`ml-2 ${parseFloat(priceChange) >= 0 ? "text-green-500" : "text-red-500"}`}>
                ({priceChange}%)
              </span>
            )}
            {rangeChange && (
              <div className="mt-2 text-sm">
                Cambio seleccionado: ${rangeChange.absoluteChange} ({rangeChange.percentageChange}%)
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              price: {
                label: "Precio",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tickFormatter={(time) => {
                    const date = new Date(time);
                    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                  }}
                />
                <YAxis
                  domain={[
                    Math.min(...data.map((d) => d.price)) * 0.9,
                    Math.max(...data.map((d) => d.price)) * 1.1,
                  ]}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="price" stroke="var(--color-price)" name="Precio" />
                {/* Componente Brush */}
                <Brush
                  dataKey="time"
                  height={30}
                  stroke="#8884d8"
                  onChange={({ startIndex, endIndex }) => handleBrushChange(startIndex, endIndex)}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
