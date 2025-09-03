import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calculator, Target, TrendingUp, Percent, Lock, CreditCard, CheckCircle } from 'lucide-react';
import { PaymentModal } from '@/components/Payment/PaymentModal';

export function TradingCalculator() {
  const [isVerified, setIsVerified] = useState(false);
  const [positionSize, setPositionSize] = useState({
    accountSize: 100000,
    riskPercentage: 2,
    stopLoss: 5,
    result: 0,
  });

  const [riskReward, setRiskReward] = useState({
    entryPrice: 100,
    stopLoss: 95,
    target: 110,
    riskAmount: 0,
    rewardAmount: 0,
    ratio: '',
  });

  const [percentageCalc, setPercentageCalc] = useState({
    buyPrice: 100,
    sellPrice: 110,
    gainLoss: 0,
    percentage: 0,
  });

  const [targetStopCalc, setTargetStopCalc] = useState({
    entryPrice: 100,
    riskReward: 2,
    riskPercentage: 5,
    stopLoss: 0,
    target: 0,
  });

  const calculatePositionSize = () => {
    const riskAmount = (positionSize.accountSize * positionSize.riskPercentage) / 100;
    const shares = Math.floor(riskAmount / positionSize.stopLoss);
    setPositionSize(prev => ({ ...prev, result: shares }));
  };

  const calculateRiskReward = () => {
    const risk = riskReward.entryPrice - riskReward.stopLoss;
    const reward = riskReward.target - riskReward.entryPrice;
    const ratio = reward / risk;
    
    setRiskReward(prev => ({
      ...prev,
      riskAmount: risk,
      rewardAmount: reward,
      ratio: `1:${ratio.toFixed(2)}`,
    }));
  };

  const calculatePercentage = () => {
    const diff = percentageCalc.sellPrice - percentageCalc.buyPrice;
    const percentage = (diff / percentageCalc.buyPrice) * 100;
    
    setPercentageCalc(prev => ({
      ...prev,
      gainLoss: diff,
      percentage: percentage,
    }));
  };

  const calculateTargetStop = () => {
    const riskAmount = (targetStopCalc.entryPrice * targetStopCalc.riskPercentage) / 100;
    const stopLoss = targetStopCalc.entryPrice - riskAmount;
    const target = targetStopCalc.entryPrice + (riskAmount * targetStopCalc.riskReward);
    
    setTargetStopCalc(prev => ({
      ...prev,
      stopLoss: stopLoss,
      target: target,
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (!isVerified) {
    return (
      <motion.div 
        className="w-full mx-auto py-4 px-4 sm:px-6 flex items-center justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 shadow-2xl rounded-3xl overflow-hidden p-6 w-full max-w-4xl">
          <CardHeader className="text-center space-y-3 mb-4">
            <Lock className="w-10 h-10 text-green-400 mx-auto" />
            <CardTitle className="text-green-400 text-3xl font-extrabold">
              Premium Community Access
            </CardTitle>
            <CardDescription className="text-gray-300 text-lg leading-relaxed">
              Subscribe to access our exclusive trading community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="text-center space-y-6">
              <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 backdrop-blur-sm">
                <CreditCard className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-400 mb-4">Here’s what you get inside:</h3>
                <ul className="text-left space-y-2 text-gray-300 text-sm leading-snug">
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🏠 Home Dashboard – Clean, simple, and powerful start to your trading journey.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />📓 Pro Journal – Track your trades, refine your strategy, and learn from every move.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🎯 Setup Tracker – Never miss a winning setup with organized, easy-to-follow tracking.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🔍 Smart Scanner – Find high-probability stocks instantly with AI-powered filters.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🌐 Community – Connect, share, and grow with like-minded traders.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />📈 Sector Rotation Tool – Spot money flow between sectors for better market timing.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🚀 LIVE Sector Rotation & Stock Data – Real-time insights, real trading advantage.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🧮 Trading Calculator – Manage risk & reward with precision.</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />🤖 LEO AI – Your personal AI-powered swing trading assistant.</li>
                </ul>
              </div>
              <PaymentModal onVerificationChange={setIsVerified}>
                <motion.div
                  whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(34,197,94,0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-block w-full sm:w-auto"
                >
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 ease-in-out transform border border-green-400">
                    <CreditCard className="w-5 h-5 mr-3" />
                    JOIN NOW
                  </Button>
                </motion.div>
              </PaymentModal>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-700 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl text-gradient flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Trading Calculator
            </CardTitle>
            <CardDescription>Essential trading calculation tools</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {/* Position Size Calculator */}
          <Card className="calculator-theme">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-accent-blue" />
                Position Size Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="accountSize">Account Size (₹)</Label>
                <Input
                  id="accountSize"
                  type="number"
                  value={positionSize.accountSize}
                  onChange={(e) => setPositionSize(prev => ({ ...prev, accountSize: parseFloat(e.target.value) || 0 }))}
                  className="bg-white/5 border-white/20"
                />
              </div>
              
              <div>
                <Label htmlFor="riskPercent">Risk Percentage (%)</Label>
                <Input
                  id="riskPercent"
                  type="number"
                  step="0.1"
                  value={positionSize.riskPercentage}
                  onChange={(e) => setPositionSize(prev => ({ ...prev, riskPercentage: parseFloat(e.target.value) || 0 }))}
                  className="bg-white/5 border-white/20"
                />
              </div>
              
              <div>
                <Label htmlFor="stopLossAmount">Stop Loss per Share (₹)</Label>
                <Input
                  id="stopLossAmount"
                  type="number"
                  step="0.01"
                  value={positionSize.stopLoss}
                  onChange={(e) => setPositionSize(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) || 0 }))}
                  className="bg-white/5 border-white/20"
                />
              </div>
              
              <Button onClick={calculatePositionSize} className="w-full gradient-blue text-white">
                Calculate Position Size
              </Button>
              
              {positionSize.result > 0 && (
                <div className="p-4 bg-accent-blue/10 rounded-lg border border-accent-blue/20">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent-blue">{positionSize.result}</div>
                    <div className="text-sm text-text-secondary">Shares to buy</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Reward Calculator */}
          <Card className="calculator-theme">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent-blue" />
                Risk:Reward Ratio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="entryPrice">Entry Price (₹)</Label>
                <Input
                  id="entryPrice"
                  type="number"
                  step="0.01"
                  value={riskReward.entryPrice}
                  onChange={(e) => setRiskReward(prev => ({ ...prev, entryPrice: parseFloat(e.target.value) || 0 }))}
                  className="bg-white/5 border-white/20"
                />
              </div>
              
              <div>
                <Label htmlFor="stopLossPrice">Stop Loss (₹)</Label>
                <Input
                  id="stopLossPrice"
                  type="number"
                  step="0.01"
                  value={riskReward.stopLoss}
                  onChange={(e) => setRiskReward(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) || 0 }))}
                  className="bg-white/5 border-white/20"
                />
              </div>
              
              <div>
                <Label htmlFor="targetPrice">Target Price (₹)</Label>
                <Input
                  id="targetPrice"
                  type="number"
                  step="0.01"
                  value={riskReward.target}
                  onChange={(e) => setRiskReward(prev => ({ ...prev, target: parseFloat(e.target.value) || 0 }))}
                  className="bg-white/5 border-white/20"
                />
              </div>
              
              <Button onClick={calculateRiskReward} className="w-full gradient-blue text-white">
                Calculate Risk:Reward
              </Button>
              
              {riskReward.ratio && (
                <div className="space-y-2">
                  <div className="p-3 bg-loss-red/10 rounded border border-loss-red/20">
                    <div className="text-sm text-text-secondary">Risk</div>
                    <div className="font-bold text-loss-red">{formatCurrency(riskReward.riskAmount)}</div>
                  </div>
                  <div className="p-3 bg-profit-green/10 rounded border border-profit-green/20">
                    <div className="text-sm text-text-secondary">Reward</div>
                    <div className="font-bold text-profit-green">{formatCurrency(riskReward.rewardAmount)}</div>
                  </div>
                  <div className="p-3 bg-accent-blue/10 rounded border border-accent-blue/20 text-center">
                    <div className="text-sm text-text-secondary">Risk:Reward Ratio</div>
                    <div className="text-xl font-bold text-accent-blue">{riskReward.ratio}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Percentage Gain/Loss Calculator */}
          <Card className="calculator-theme">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-accent-blue" />
                % Gain/Loss Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="buyPrice">Buy Price (₹)</Label>
                <Input
                  id="buyPrice"
                  type="number"
                  step="0.01"
                  value={percentageCalc.buyPrice}
                  onChange={(e) => setPercentageCalc(prev => ({ ...prev, buyPrice: parseFloat(e.target.value) || 0 }))}
                  className="bg-white/5 border-white/20"
                />
              </div>
              
              <div>
                <Label htmlFor="sellPrice">Sell Price (₹)</Label>
                <Input
                  id="sellPrice"
                  type="number"
                  step="0.01"
                  value={percentageCalc.sellPrice}
                  onChange={(e) => setPercentageCalc(prev => ({ ...prev, sellPrice: parseFloat(e.target.value) || 0 }))}
                  className="bg-white/5 border-white/20"
                />
              </div>
              
              <Button onClick={calculatePercentage} className="w-full gradient-blue text-white">
                Calculate Percentage
              </Button>
              
              {percentageCalc.percentage !== 0 && (
                <div className="space-y-2">
                  <div className={`p-4 rounded-lg border ${
                    percentageCalc.gainLoss >= 0 
                      ? 'bg-profit-green/10 border-profit-green/20' 
                      : 'bg-loss-red/10 border-loss-red/20'
                  }`}>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        percentageCalc.gainLoss >= 0 ? 'text-profit-green' : 'text-loss-red'
                      }`}>
                        {percentageCalc.gainLoss >= 0 ? '+' : ''}{percentageCalc.percentage.toFixed(2)}%
                      </div>
                      <div className="text-sm text-text-secondary">
                        {formatCurrency(percentageCalc.gainLoss)} per share
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Target/Stop Loss Calculator */}
          <Card className="calculator-theme">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-accent-blue" />
                Target/Stop Loss Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="entryPriceTarget">Entry Price (₹)</Label>
                <Input
                  id="entryPriceTarget"
                  type="number"
                  step="0.01"
                  value={targetStopCalc.entryPrice}
                  onChange={(e) => setTargetStopCalc(prev => ({ ...prev, entryPrice: parseFloat(e.target.value) || 0 }))}
                  className="bg-white/5 border-white/20"
                />
              </div>
              
              <div>
                <Label htmlFor="riskRewardRatio">Risk:Reward Ratio</Label>
                <Input
                  id="riskRewardRatio"
                  type="number"
                  step="0.1"
                  value={targetStopCalc.riskReward}
                  onChange={(e) => setTargetStopCalc(prev => ({ ...prev, riskReward: parseFloat(e.target.value) || 0 }))}
                  className="bg-white/5 border-white/20"
                />
              </div>
              
              <div>
                <Label htmlFor="riskPercentageTarget">Risk Percentage (%)</Label>
                <Input
                  id="riskPercentageTarget"
                  type="number"
                  step="0.1"
                  value={targetStopCalc.riskPercentage}
                  onChange={(e) => setTargetStopCalc(prev => ({ ...prev, riskPercentage: parseFloat(e.target.value) || 0 }))}
                  className="bg-white/5 border-white/20"
                />
              </div>
              
              <Button onClick={calculateTargetStop} className="w-full gradient-blue text-white">
                Calculate Levels
              </Button>
              
              {targetStopCalc.stopLoss > 0 && (
                <div className="space-y-2">
                  <div className="p-3 bg-loss-red/10 rounded border border-loss-red/20">
                    <div className="text-sm text-text-secondary">Stop Loss</div>
                    <div className="font-bold text-loss-red">{formatCurrency(targetStopCalc.stopLoss)}</div>
                  </div>
                  <div className="p-3 bg-profit-green/10 rounded border border-profit-green/20">
                    <div className="text-sm text-text-secondary">Target</div>
                    <div className="font-bold text-profit-green">{formatCurrency(targetStopCalc.target)}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
