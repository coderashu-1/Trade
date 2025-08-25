import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { refreshUserData } from '../actions/userActions';
import { buyStock } from '../actions/stockActions';
import NavBar from './NavBar';
import Footerv2 from './Footerv2';
import { createChart } from 'lightweight-charts';
import { Alert, Button, Col, Container, Form, Row, Spinner } from 'react-bootstrap';

// ------------------- Configuration & Helpers -------------------
const AVAILABLE_PAIRS = [
  { group: 'Crypto', label: 'Bitcoin / USDT', value: 'BINANCE:BTCUSDT' },
  { group: 'Crypto', label: 'Ethereum / USDT', value: 'BINANCE:ETHUSDT' },
  { group: 'Crypto', label: 'BNB / USDT', value: 'BINANCE:BNBUSDT' },
  { group: 'Forex', label: 'EUR / USD', value: 'OANDA:EURUSD' },
  { group: 'Forex', label: 'USD / JPY', value: 'OANDA:USDJPY' },
  { group: 'Commodities', label: 'Gold (XAU/USD)', value: 'OANDA:XAUUSD' },
  { group: 'Stocks', label: 'Apple', value: 'NASDAQ:AAPL' },
  { group: 'Stocks', label: 'Tesla', value: 'NASDAQ:TSLA' },
  { group: 'Indices', label: 'S&P 500', value: 'INDEX:SP500' },
];

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws/!ticker@arr';

const normalizePair = (pair = '') => {
  if (!pair) return { provider: null, symbol: null };
  const parts = pair.split(':');
  if (parts.length !== 2) return { provider: null, symbol: null };
  return { provider: parts[0], symbol: parts[1] };
};

const toBinanceSymbol = (s = '') => s.replace('/', '').toUpperCase();
const safeNumber = (x) => (typeof x === 'number' && isFinite(x) ? x : null);
const fmt = (v) => (safeNumber(v) !== null ? v.toFixed(2) : '-');

// ------------------- Price Feed Manager -------------------
class PriceFeedManager {
  constructor() {
    this.binancePrices = new Map();
    this.subscribers = new Map();
    this.ws = null;
    this.reconnectAttempt = 0;
    this.connect();
  }

  connect() {
    try {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
      this.ws = new WebSocket(BINANCE_WS_URL);

      this.ws.onopen = () => { this.reconnectAttempt = 0; console.info('Binance WS open'); };
      this.ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (!Array.isArray(data)) return;
          for (const t of data) {
            if (t && t.s && t.c) {
              const sym = t.s.toUpperCase();
              const price = parseFloat(t.c);
              this.binancePrices.set(sym, price);
              const key = `BINANCE:${sym}`;
              this.broadcast(key, price);
            }
          }
        } catch (err) { console.error('WS parse error', err); }
      };
      this.ws.onclose = () => {
        this.reconnectAttempt += 1;
        const delay = Math.min(30000, 500 * Math.pow(2, this.reconnectAttempt));
        console.warn('WS closed, reconnect in', delay);
        setTimeout(() => this.connect(), delay);
      };
      this.ws.onerror = (err) => console.warn('WS err', err);
    } catch (err) { console.error('WS connect err', err); }
  }

  subscribe(key, cb) {
    if (!this.subscribers.has(key)) this.subscribers.set(key, new Set());
    this.subscribers.get(key).add(cb);

    const { provider, symbol } = normalizePair(key);
    if (provider === 'BINANCE') {
      const p = this.binancePrices.get(toBinanceSymbol(symbol));
      if (p !== undefined) cb({ price: p });
    }

    return () => {
      const s = this.subscribers.get(key);
      if (s) {
        s.delete(cb);
        if (s.size === 0) this.subscribers.delete(key);
      }
    };
  }

  broadcast(key, price) {
    const s = this.subscribers.get(key);
    if (s) s.forEach((cb) => { try { cb({ price }); } catch (e) { console.error(e); } });
  }
}

const priceFeed = new PriceFeedManager();

// ------------------- Chart Hook -------------------
const useLightweightChart = (containerRef) => {
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 520,
      layout: { background: { color: '#0f0f0f' }, textColor: '#d1d4dc' },
      grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } },
      timeScale: { timeVisible: true, secondsVisible: true },
    });

    seriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: '#0f0', downColor: '#f33', borderDownColor: '#f33', borderUpColor: '#0f0', wickDownColor: '#f33', wickUpColor: '#0f0'
    });

    const handleResize = () => { if (chartRef.current) chartRef.current.resize(containerRef.current.clientWidth, 520); };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      try { chartRef.current.remove(); } catch (e) {}
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [containerRef]);

  const setCandles = useCallback((candles) => { if (seriesRef.current) seriesRef.current.setData(candles); }, []);
  const updateLast = useCallback((bar) => { if (seriesRef.current) seriesRef.current.update(bar); }, []);
  const addMarker = useCallback((marker) => { markersRef.current.push(marker); if (seriesRef.current) seriesRef.current.setMarkers([...markersRef.current]); }, []);
  const clearMarkers = useCallback(() => { markersRef.current = []; if (seriesRef.current) seriesRef.current.setMarkers([]); }, []);

  return { setCandles, updateLast, addMarker, clearMarkers, chartRef, seriesRef };
};

// ------------------- Main Component -------------------
const LiveTradingWithChartMarkers = ({ auth, refreshUserData, buyStock }) => {
  const [selectedValue, setSelectedValue] = useState(AVAILABLE_PAIRS[0].value);
  const [livePrice, setLivePrice] = useState(null);
  const [connecting, setConnecting] = useState(true);

  const [betAmount, setBetAmount] = useState(10);
  const [betDuration, setBetDuration] = useState(5);
  const [stopLossEnabled, setStopLossEnabled] = useState(false);
  const [stopLossAmount, setStopLossAmount] = useState(0);
  const [strikePrice, setStrikePrice] = useState('');

  const [activeBet, setActiveBet] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  const [betHistory, setBetHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [waitingForStrike, setWaitingForStrike] = useState(false);
  const hasTriggeredRef = useRef(false);
  const strikeUnsubRef = useRef(null);

  const chartContainerRef = useRef();
  const { setCandles, updateLast, addMarker, clearMarkers } = useLightweightChart(chartContainerRef);

  const livePriceRef = useRef(null);
  useEffect(() => { livePriceRef.current = livePrice; }, [livePrice]);
  const getLatestPrice = useCallback(() => livePriceRef.current ?? livePrice, [livePrice]);

  // ------------------- Price Feed Subscription -------------------
  useEffect(() => {
    setConnecting(true);
    const unsub = priceFeed.subscribe(selectedValue, ({ price }) => {
      setLivePrice(price);
      setConnecting(false);
    });
    return () => { try { unsub(); } catch (e) {} };
  }, [selectedValue]);

  // ------------------- Load Candles -------------------
  useEffect(() => {
    const loadHistoryCandles = async () => {
      try {
        const { provider, symbol } = normalizePair(selectedValue);
        if (provider === 'BINANCE') {
          const binSym = toBinanceSymbol(symbol);
          const url = `https://api.binance.com/api/v3/klines?symbol=${binSym}&interval=1m&limit=500`;
          const r = await fetch(url);
          if (!r.ok) throw new Error('klines failed');
          const data = await r.json();
          const candles = data.map(c => ({
            time: Math.floor(c[0] / 1000),
            open: parseFloat(c[1]),
            high: parseFloat(c[2]),
            low: parseFloat(c[3]),
            close: parseFloat(c[4])
          }));
          setCandles(candles);
          if (candles.length) setLivePrice(candles[candles.length - 1].close);
        } else {
          const now = Math.floor(Date.now() / 1000);
          const candles = Array.from({ length: 200 }).map((_, i) => {
            const t = now - (200 - i) * 60;
            const price = 100 + Math.sin(i / 10) * 2 + i * 0.01;
            return { time: t, open: price * 0.995, high: price * 1.005, low: price * 0.99, close: price };
          });
          setCandles(candles);
          setLivePrice(candles[candles.length - 1].close);
        }
      } catch (err) { console.error('Failed to load candles', err); }
    };
    loadHistoryCandles();
  }, [selectedValue, setCandles]);

  // ------------------- Update Last Candle -------------------
  useEffect(() => {
    if (!safeNumber(livePrice)) return;
    const nowSec = Math.floor(Date.now() / 1000);
    const bar = { time: nowSec, open: livePrice, high: livePrice, low: livePrice, close: livePrice };
    try { updateLast(bar); } catch (e) {}
  }, [livePrice, updateLast]);

  // ------------------- Load Bet History -------------------
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/stocks/find', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: auth.user._id })
        });
        const data = await res.json();
        const fmtBet = (d) => ({
          time: new Date(d.date).toLocaleString(),
          direction: d.data?.direction || '-',
          result: d.data?.outcome === 'stopped' ? 'Stopped (Loss)' : (d.data?.outcome || '-'),
          entryPrice: parseFloat(d.price) || 0,
          resultPrice: d.data?.resultPrice ? parseFloat(d.data.resultPrice) : null,
          amount: parseFloat(d.value) || 0,
          pair: d.ticker,
          rawDate: new Date(d.date)
        });
        const today = new Date(); today.setHours(0,0,0,0);
        if (mounted) {
          const todayBets = (data || []).map(fmtBet).filter(b => b.rawDate >= today);
          setBetHistory(todayBets);
        }
      } catch (e) { console.error(e); }
      finally { if (mounted) setLoadingHistory(false); }
    })();
    return () => { mounted = false; };
  }, [auth.user._id]);

  // ------------------- Clear Strike -------------------
  const clearStrikeSubscription = useCallback(() => {
    if (strikeUnsubRef.current) { try { strikeUnsubRef.current(); } catch (e) {} strikeUnsubRef.current = null; }
  }, []);

  useEffect(() => {
    if (waitingForStrike) {
      clearStrikeSubscription();
      hasTriggeredRef.current = false;
      setWaitingForStrike(false);
    }
  }, [selectedValue, strikePrice, waitingForStrike, clearStrikeSubscription]);

  // ------------------- Begin Bet -------------------
  const beginBet = useCallback((bet) => {
    setActiveBet(bet);
    setTimeLeft(bet.duration);

    try { addMarker({ time: Math.floor(Date.now() / 1000), position: bet.direction === 'up' ? 'belowBar' : 'aboveBar', color: bet.direction === 'up' ? '#4caf50' : '#f44336', shape: 'arrowUp', text: `Entry ${fmt(bet.entryPrice)}` }); } catch (e) { console.error(e); }

    let seconds = bet.duration;
    timerRef.current = setInterval(async () => {
      const current = getLatestPrice();

      if (stopLossEnabled && stopLossAmount > 0 && safeNumber(current) !== null) {
        const priceMovement = bet.direction === 'up' ? (bet.entryPrice - current) : (current - bet.entryPrice);
        if (priceMovement >= stopLossAmount) {
          clearInterval(timerRef.current); timerRef.current = null;
          await finalizeBet('stopped', current, bet);
          return;
        }
      }

      if (seconds <= 1) {
        clearInterval(timerRef.current); timerRef.current = null;
        const didWin = (bet.direction === 'up' && current > bet.entryPrice) || (bet.direction === 'down' && current < bet.entryPrice);
        await finalizeBet(didWin ? 'won' : 'lost', current, bet);
      } else {
        seconds -= 1;
        setTimeLeft(seconds);
      }
    }, 1000);
  }, [addMarker, getLatestPrice, stopLossAmount, stopLossEnabled, finalizeBet]);

  // ------------------- Finalize Bet -------------------
  const finalizeBet = useCallback(async (outcome, exitPrice, bet) => {
    try { addMarker({ time: Math.floor(Date.now() / 1000), position: bet.direction === 'up' ? 'aboveBar' : 'belowBar', color: '#2196f3', shape: 'arrowDown', text: `Exit ${fmt(exitPrice)}` }); } catch (e) { console.error(e); }

    const payload = { value: bet.amount, price: bet.entryPrice, quantity: 1, ticker: selectedValue, data: { resultPrice: exitPrice, direction: bet.direction, outcome } };
    try {
      await buyStock(payload);
      const rec = { time: new Date().toLocaleString(), direction: bet.direction, result: outcome === 'stopped' ? 'Stopped (Loss)' : outcome, entryPrice: bet.entryPrice, resultPrice: exitPrice, amount: bet.amount, pair: selectedValue };
      setBetHistory((p) => [rec, ...p]);
    } catch (err) { console.error('Error saving bet', err); }
    finally {
      setActiveBet(null); setTimeLeft(0); hasTriggeredRef.current = false; clearStrikeSubscription(); setWaitingForStrike(false);
      try { await refreshUserData(); } catch (e) {}
    }
  }, [addMarker, buyStock, refreshUserData, selectedValue, clearStrikeSubscription]);

  // ------------------- Start Bet -------------------
  const startBet = useCallback(async (direction) => {
    if (activeBet) return alert('A bet is already active');
    setActiveBet(null); setTimeLeft(0);

    const balance = auth.user?.balance || 0;
    if (!betAmount || betAmount <= 0) return alert('Bet amount must be > 0');
    if (betAmount > balance) return alert('Insufficient balance');

    const strike = strikePrice ? parseFloat(strikePrice) : null;
    if (strike && isFinite(strike)) {
      clearStrikeSubscription(); hasTriggeredRef.current = false; setWaitingForStrike(true);
      const key = selectedValue;
      const unsub = priceFeed.subscribe(key, ({ price }) => {
        if (!isFinite(price)) return;
        if (hasTriggeredRef.current) return;
        const crossed = (direction === 'up' && price >= strike) || (direction === 'down' && price <= strike);
        if (crossed) {
          hasTriggeredRef.current = true;
          try { unsub(); } catch (e) {} strikeUnsubRef.current = null; setWaitingForStrike(false);
          const bet = { direction, amount: betAmount, entryPrice: price, duration: betDuration, strike };
          beginBet(bet);
        }
      });
      strikeUnsubRef.current = unsub;
      return;
    }

    const current = getLatestPrice();
    if (!isFinite(current)) return alert('Current price unavailable');
    const bet = { direction, amount: betAmount, entryPrice: current, duration: betDuration, strike: null };
    beginBet(bet);
  }, [activeBet, auth.user, betAmount, betDuration, beginBet, clearStrikeSubscription, getLatestPrice, selectedValue, strikePrice]);

  const cancelPending = useCallback(() => { clearStrikeSubscription(); hasTriggeredRef.current = false; setWaitingForStrike(false); }, [clearStrikeSubscription]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); clearStrikeSubscription(); }, [clearStrikeSubscription]);

  // ------------------- Render History -------------------
  const renderHistoryItem = (h, idx) => (
    <div key={idx} style={{ padding: 8, marginBottom: 6, borderRadius: 6, background: '#141414' }}>
      <strong>{h.time}</strong> - {h.pair} - {h.direction.toUpperCase()} - Entry: {fmt(h.entryPrice)} - Result: {h.result} {h.resultPrice !== null ? `(Exit: ${fmt(h.resultPrice)})` : ''} - Amount: {fmt(h.amount)}
    </div>
  );

  // ------------------- JSX -------------------
  const diffText = (() => {
    const d = safeNumber(livePrice) !== null && activeBet ? livePrice - activeBet.entryPrice : null;
    return d !== null ? `${d >= 0 ? '+' : ''}${fmt(d)}` : '-';
  })();

  return (
    <>
      <NavBar />
      <Container fluid style={{ padding: 16, background: '#0f0f0f', color: '#fff' }}>
        <Row>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Select Pair</Form.Label>
              <Form.Control as="select" value={selectedValue} onChange={(e) => setSelectedValue(e.target.value)}>
                {Array.from(new Set(AVAILABLE_PAIRS.map(p => p.group))).map(g => (
                  <optgroup key={g} label={g}>
                    {AVAILABLE_PAIRS.filter(p => p.group === g).map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </optgroup>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group className="mt-2">
              <Form.Label>Bet Amount</Form.Label>
              <Form.Control type="number" value={betAmount} onChange={e => setBetAmount(parseFloat(e.target.value))} />
            </Form.Group>
            <Form.Group className="mt-2">
              <Form.Label>Duration (seconds)</Form.Label>
              <Form.Control type="number" value={betDuration} onChange={e => setBetDuration(parseFloat(e.target.value))} />
            </Form.Group>
            <Form.Group className="mt-2">
              <Form.Label>Strike Price (optional)</Form.Label>
              <Form.Control type="number" value={strikePrice} onChange={e => setStrikePrice(e.target.value)} />
            </Form.Group>
            <Form.Group className="mt-2">
              <Form.Check type="checkbox" label="Enable Stop Loss" checked={stopLossEnabled} onChange={e => setStopLossEnabled(e.target.checked)} />
              {stopLossEnabled && (
                <Form.Control type="number" placeholder="Stop loss amount" value={stopLossAmount} onChange={e => setStopLossAmount(parseFloat(e.target.value))} className="mt-1" />
              )}
            </Form.Group>
            <div className="mt-3 d-flex gap-2">
              <Button variant="success" onClick={() => startBet('up')} disabled={activeBet || waitingForStrike}>BUY UP</Button>
              <Button variant="danger" onClick={() => startBet('down')} disabled={activeBet || waitingForStrike}>BUY DOWN</Button>
              {waitingForStrike && <Button variant="secondary" onClick={cancelPending}>Cancel Pending</Button>}
            </div>
            <div className="mt-3">
              <strong>Live Price: </strong>{connecting ? <Spinner animation="border" size="sm" /> : fmt(livePrice)} <br />
              {activeBet && <span><strong>Diff:</strong> {diffText} | Time Left: {timeLeft}s</span>}
            </div>
          </Col>
          <Col md={8}>
            <div ref={chartContainerRef} style={{ width: '100%', height: 520, background: '#000' }} />
          </Col>
        </Row>
        <Row className="mt-4">
          <Col>
            <h5>Today's Bet History</h5>
            {loadingHistory ? <Spinner animation="border" /> : betHistory.map(renderHistoryItem)}
          </Col>
        </Row>
      </Container>
      <Footerv2 />
    </>
  );
};

LiveTradingWithChartMarkers.propTypes = { auth: PropTypes.object.isRequired, refreshUserData: PropTypes.func.isRequired, buyStock: PropTypes.func.isRequired };

const mapStateToProps = (state) => ({ auth: state.auth });
export default connect(mapStateToProps, { refreshUserData, buyStock })(LiveTradingWithChartMarkers);
