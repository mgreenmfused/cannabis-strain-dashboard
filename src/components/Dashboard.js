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
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading strain data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cannabis Strain Performance Dashboard
          </h1>
          <p className="text-gray-600">
            Track strain success, baseline performance, and monthly trends across markets
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Market</label>
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="Total">All Markets</option>
                {markets.map(market => (
                  <option key={market} value={market}>{market}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Line</label>
              <select
                value={selectedProductLine}
                onChange={(e) => setSelectedProductLine(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Lines</option>
                {productLines.map(line => (
                  <option key={line} value={line}>{line} Cartridge</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pack Size</label>
              <select
                value={selectedPackSize}
                onChange={(e) => setSelectedPackSize(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Sizes</option>
                {packSizes.map(size => (
                  <option key={size} value={size}>
                    {size === 1 ? 'Single' : `${size}-Pack`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Strain</label>
              <select
                value={selectedStrain}
                onChange={(e) => setSelectedStrain(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Strains</option>
                {strains.map(strain => (
                  <option key={strain} value={strain}>{strain}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Metric</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="revenue">Revenue</option>
                <option value="units">Units Sold</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedProductLine('All');
                  setSelectedPackSize('All');
                  setSelectedStrain('All');
                  setSelectedMarket('Total');
                  setMarketView('combined');
                }}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {viewMode === 'revenue' ? 'Revenue' : 'Units'} Trends by Month
            {selectedMarket !== 'Total' && (
              <span className="text-base font-normal text-gray-600 ml-2">- {selectedMarket} Market</span>
            )}
          </h2>
          
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'line' ? (
              <LineChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={(value) => `Month ${value}`} />
                <YAxis tickFormatter={viewMode === 'revenue' ? formatCurrency : formatNumber} />
                <Tooltip 
                  formatter={(value, name) => [
                    viewMode === 'revenue' ? formatCurrency(value) : formatNumber(value),
                    formatChartLabel(name)
                  ]}
                  labelFormatter={(value) => `Month ${value}`}
                />
                <Legend formatter={(value) => formatChartLabel(value)} />
                {strainCombinations.map((strain, index) => (
                  <Line
                    key={strain}
                    type="monotone"
                    dataKey={strain}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={(value) => `Month ${value}`} />
                <YAxis tickFormatter={viewMode === 'revenue' ? formatCurrency : formatNumber} />
                <Tooltip 
                  formatter={(value, name) => [
                    viewMode === 'revenue' ? formatCurrency(value) : formatNumber(value),
                    formatChartLabel(name)
                  ]}
                  labelFormatter={(value) => `Month ${value}`}
                />
                <Legend formatter={(value) => formatChartLabel(value)} />
                {strainCombinations.map((strain, index) => (
                  <Bar
                    key={strain}
                    dataKey={strain}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🎉 Cannabis Strain Dashboard Ready!
          </h3>
          <div className="text-blue-800 space-y-2">
            <p><strong>✓ Multi-Market Analysis:</strong> Filter by AZ, CA, NV, or view all markets</p>
            <p><strong>✓ Product Line Tracking:</strong> Fire, Twisted, Loud, Fattys cartridges</p>
            <p><strong>✓ Strain Performance:</strong> Track individual strain success and trends</p>
            <p><strong>✓ Pack Size Analysis:</strong> Compare single units vs multi-packs</p>
            <p><strong>Ready for your real data!</strong> Use the filters above to explore your strain performance.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
