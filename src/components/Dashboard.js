import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const sampleData = {
          "monthly": [
            {
              "year": 2025,
              "month": 1,
              "product_line": "Twisted",
              "strain": "Blue Magic",
              "pk": 1,
              "units": 6223,
              "revenue": 113918.6,
              "market": "AZ"
            },
            {
              "year": 2025,
              "month": 1,
              "product_line": "Fire",
              "strain": "Grandaddy Purple", 
              "pk": 1,
              "units": 5568,
              "revenue": 109025,
              "market": "CA"
            },
            {
              "year": 2025,
              "month": 2,
              "product_line": "Twisted",
              "strain": "Blue Magic",
              "pk": 1,
              "units": 6685,
              "revenue": 116780.4,
              "market": "AZ"
            },
            {
              "year": 2025,
              "month": 2,
              "product_line": "Fire",
              "strain": "Grandaddy Purple",
              "pk": 1,
              "units": 3310,
              "revenue": 65125,
              "market": "CA"
            },
            {
              "year": 2025,
              "month": 3,
              "product_line": "Twisted",
              "strain": "Blue Magic",
              "pk": 1,
              "units": 7200,
              "revenue": 125000,
              "market": "AZ"
            },
            {
              "year": 2025,
              "month": 3,
              "product_line": "Fire",
              "strain": "Grandaddy Purple",
              "pk": 1,
              "units": 4100,
              "revenue": 78000,
              "market": "CA"
            }
          ]
        };
        setData(sampleData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const [selectedProductLine, setSelectedProductLine] = useState('All');
  const [selectedPackSize, setSelectedPackSize] = useState('All');
  const [selectedStrain, setSelectedStrain] = useState('All');
  const [selectedMarket, setSelectedMarket] = useState('Total');
  const [viewMode, setViewMode] = useState('revenue');
  const [chartType, setChartType] = useState('line');
  const [marketView, setMarketView] = useState('combined');

  const processedData = useMemo(() => {
    if (!data?.monthly) return [];
    
    let filteredData = data.monthly;

    if (selectedProductLine !== 'All') {
      filteredData = filteredData.filter(d => d.product_line === selectedProductLine);
    }
    if (selectedPackSize !== 'All') {
      filteredData = filteredData.filter(d => d.pk === parseInt(selectedPackSize));
    }
    if (selectedStrain !== 'All') {
      filteredData = filteredData.filter(d => d.strain === selectedStrain);
    }
    if (selectedMarket !== 'Total') {
      filteredData = filteredData.filter(d => d.market === selectedMarket);
    }

    const chartData = {};
    
    if (marketView === 'individual' && selectedMarket === 'Total') {
      filteredData.forEach(item => {
        const key = `${item.year}-${item.month}`;
        if (!chartData[key]) {
          chartData[key] = { month: item.month, year: item.year };
        }
        
        const marketKey = `${item.market}_Total`;
        if (!chartData[key][marketKey]) {
          chartData[key][marketKey] = 0;
        }
        chartData[key][marketKey] += item[viewMode];
      });
    } else {
      filteredData.forEach(item => {
        const key = `${item.year}-${item.month}`;
        if (!chartData[key]) {
          chartData[key] = { month: item.month, year: item.year };
        }
        
        let dataKey;
        if (selectedMarket === 'Total' && marketView === 'combined') {
          dataKey = `${item.product_line}_${item.strain}_pk${item.pk}`;
        } else {
          dataKey = `${item.product_line}_${item.strain}_pk${item.pk}_${item.market}`;
        }
        
        if (!chartData[key][dataKey]) {
          chartData[key][dataKey] = 0;
        }
        chartData[key][dataKey] += item[viewMode];
      });
    }

    return Object.values(chartData).sort((a, b) => a.month - b.month);
  }, [data, selectedProductLine, selectedPackSize, selectedStrain, selectedMarket, viewMode, marketView]);

  const productLines = [...new Set(data?.monthly?.map(d => d.product_line) || [])];
  const packSizes = [...new Set(data?.monthly?.map(d => d.pk) || [])];
  const markets = [...new Set(data?.monthly?.map(d => d.market) || [])];
  const strains = [...new Set((data?.monthly || []).filter(d => 
    selectedProductLine === 'All' || d.product_line === selectedProductLine
  ).map(d => d.strain))];

  const strainCombinations = [...new Set((data?.monthly || []).filter(d => {
    if (selectedProductLine !== 'All' && d.product_line !== selectedProductLine) return false;
    if (selectedPackSize !== 'All' && d.pk !== parseInt(selectedPackSize)) return false;
    if (selectedStrain !== 'All' && d.strain !== selectedStrain) return false;
    if (selectedMarket !== 'Total' && d.market !== selectedMarket) return false;
    return true;
  }).map(d => {
    if (marketView === 'individual' && selectedMarket === 'Total') {
      return `${d.market}_Total`;
    } else if (selectedMarket === 'Total' && marketView === 'combined') {
      return `${d.product_line}_${d.strain}_pk${d.pk}`;
    } else {
      return `${d.product_line}_${d.strain}_pk${d.pk}_${d.market}`;
    }
  }))];

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatChartLabel = (value) => {
    if (marketView === 'individual' && selectedMarket === 'Total') {
      return value.replace('_Total', ' Market');
    } else {
      const parts = value.split('_');
      if (parts.length >= 3) {
        let formatted = parts.slice(0, 3).join(' - ').replace('pk', 'Pack ');
        if (parts.length > 3) {
          formatted += ` (${parts[3]})`;
        }
        return formatted;
      }
      return value.replace(/_/g, ' - ').replace('pk', 'Pack ');
    }
  };

  if (loading) {
