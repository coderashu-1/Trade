// /*
//   LiveTradingWithChartMarkers.js

//   Full-featured React component that:
//     - Uses Binance websocket (!ticker@arr) for live crypto prices
//     - Uses Lightweight Charts (tradingview lightweight-charts) for rendering a candlestick chart
//     - Adds entry & exit markers when a bet starts/ends
//     - Ensures entry price captured at start and exit price captured at close
//     - Shows a Binomo-like right-side overlay while trade is active
//     - Supports optional strike/trigger price and inclusive stop-loss
//     - Saves bets via buyStock and refreshes user's balance

//   Requirements:
//     npm install lightweight-charts
//     npm install react-bootstrap
//     npm install prop-types
//     redux actions: refreshUserData, buyStock

//   Drop into src/components/LiveTradingWithChartMarkers.js
// */

// import React, { useCallback, useEffect, useRef, useState } from 'react';
// import PropTypes from 'prop-types';
// import { connect } from 'react-redux';
// import { refreshUserData } from '../actions/userActions';
// import { buyStock } from '../actions/stockActions';
// import NavBar from './NavBar';
// import Footerv2 from './Footerv2';
// import { createChart } from 'lightweight-charts';
// import { Alert, Button, Col, Container, Form, Row, Spinner } from 'react-bootstrap';

// // ------------------- Configuration & Helpers -------------------
// const AVAILABLE_PAIRS = [
//   { group: 'Crypto', label: 'Bitcoin / USDT', value: 'BINANCE:BTCUSDT' },
//   { group: 'Crypto', label: 'Ethereum / USDT', value: 'BINANCE:ETHUSDT' },
//   { group: 'Crypto', label: 'BNB / USDT', value: 'BINANCE:BNBUSDT' },
//   { group: 'Forex', label: 'EUR / USD', value: 'OANDA:EURUSD' },
//   { group: 'Forex', label: 'USD / JPY', value: 'OANDA:USDJPY' },
//   { group: 'Commodities', label: 'Gold (XAU/USD)', value: 'OANDA:XAUUSD' },
//   { group: 'Stocks', label: 'Apple', value: 'NASDAQ:AAPL' },
//   { group: 'Stocks', label: 'Tesla', value: 'NASDAQ:TSLA' },
//   { group: 'Indices', label: 'S&P 500', value: 'INDEX:SP500' },
// ];

// const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws/!ticker@arr';
// const POLLING_INTERVAL_MS = 3000;

// const normalizePair = (pair = '') => {
//   if (!pair) return { provider: null, symbol: null };
//   const parts = pair.split(':');
//   if (parts.length !== 2) return { provider: null, symbol: null };
//   return { provider: parts[0], symbol: parts[1] };
// };

// const toBinanceSymbol = (s = '') => s.replace('/', '').toUpperCase();
// const safeNumber = (x) => (typeof x === 'number' && isFinite(x) ? x : null);
// const fmt = (v) => (safeNumber(v) !== null ? v.toFixed(2) : '-');

// // ------------------- Price Feed Manager (singleton) -------------------
// class PriceFeedManager {
//   constructor() {
//     this.binancePrices = new Map();
//     this.subscribers = new Map(); // key -> Set(cb)
//     this.ws = null;
//     this.reconnectAttempt = 0;

//     this.connect();
//   }

//   connect() {
//     try {
//       if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
//       this.ws = new WebSocket(BINANCE_WS_URL);

//       this.ws.onopen = () => {
//         this.reconnectAttempt = 0;
//         console.info('Binance WS open');
//       };

//       this.ws.onmessage = (ev) => {
//         try {
//           const data = JSON.parse(ev.data);
//           if (!Array.isArray(data)) return;
//           for (const t of data) {
//             if (t && t.s && t.c) {
//               const sym = t.s.toUpperCase();
//               const price = parseFloat(t.c);
//               this.binancePrices.set(sym, price);
//               const key = `BINANCE:${sym}`;
//               this.broadcast(key, price);
//             }
//           }
//         } catch (err) {
//           console.error('WS parse error', err);
//         }
//       };

//       this.ws.onclose = () => {
//         this.reconnectAttempt += 1;
//         const delay = Math.min(30000, 500 * Math.pow(2, this.reconnectAttempt));
//         console.warn('WS closed, reconnect in', delay);
//         setTimeout(() => this.connect(), delay);
//       };

//       this.ws.onerror = (err) => console.warn('WS err', err);
//     } catch (err) {
//       console.error('WS connect err', err);
//     }
//   }

//   subscribe(key, cb) {
//     if (!this.subscribers.has(key)) this.subscribers.set(key, new Set());
//     this.subscribers.get(key).add(cb);

//     // immediate emit if we have price
//     const { provider, symbol } = normalizePair(key);
//     if (provider === 'BINANCE') {
//       const p = this.binancePrices.get(toBinanceSymbol(symbol));
//       if (p !== undefined) cb({ price: p });
//     }

//     return () => {
//       const s = this.subscribers.get(key);
//       if (s) {
//         s.delete(cb);
//         if (s.size === 0) this.subscribers.delete(key);
//       }
//     };
//   }

//   broadcast(key, price) {
//     const s = this.subscribers.get(key);
//     if (s) s.forEach((cb) => { try { cb({ price }); } catch (e) { console.error(e); } });
//   }
// }

// const priceFeed = new PriceFeedManager();

// // ------------------- Chart Helper (Lightweight) -------------------
// const useLightweightChart = (containerRef, initialSymbol) => {
//   const chartRef = useRef(null);
//   const seriesRef = useRef(null);
//   const markersRef = useRef([]);

//   useEffect(() => {
//     if (!containerRef.current) return;

//     // create chart
//     chartRef.current = createChart(containerRef.current, {
//       width: containerRef.current.clientWidth,
//       height: 520,
//       layout: { background: { color: '#0f0f0f' }, textColor: '#d1d4dc' },
//       grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } },
//       timeScale: { timeVisible: true, secondsVisible: true },
//     });

//     seriesRef.current = chartRef.current.addCandlestickSeries({
//       upColor: '#0f0', downColor: '#f33', borderDownColor: '#f33', borderUpColor: '#0f0', wickDownColor: '#f33', wickUpColor: '#0f0'
//     });

//     // handle resize
//     const handleResize = () => { if (chartRef.current) chartRef.current.resize(containerRef.current.clientWidth, 520); };
//     window.addEventListener('resize', handleResize);

//     return () => {
//       window.removeEventListener('resize', handleResize);
//       try { chartRef.current.remove(); } catch (e) {}
//       chartRef.current = null;
//       seriesRef.current = null;
//     };
//   }, [containerRef]);

//   const setCandles = useCallback((candles) => {
//     if (seriesRef.current) seriesRef.current.setData(candles);
//   }, []);

//   const updateLast = useCallback((bar) => {
//     if (seriesRef.current) seriesRef.current.update(bar);
//   }, []);

//   const addMarker = useCallback((marker) => {
//     markersRef.current.push(marker);
//     if (seriesRef.current) seriesRef.current.setMarkers([...markersRef.current]);
//   }, []);

//   const clearMarkers = useCallback(() => {
//     markersRef.current = [];
//     if (seriesRef.current) seriesRef.current.setMarkers([]);
//   }, []);

//   return { setCandles, updateLast, addMarker, clearMarkers, chartRef, seriesRef };
// };

// // ------------------- Main Component -------------------
// const LiveTradingWithChartMarkers = ({ auth, refreshUserData, buyStock }) => {
//   const [selectedValue, setSelectedValue] = useState(AVAILABLE_PAIRS[0].value);
//   const [livePrice, setLivePrice] = useState(null);
//   const [connecting, setConnecting] = useState(true);

//   // bet form
//   const [betAmount, setBetAmount] = useState(10);
//   const [betDuration, setBetDuration] = useState(5);
//   const [stopLossEnabled, setStopLossEnabled] = useState(false);
//   const [stopLossAmount, setStopLossAmount] = useState(0);
//   const [strikePrice, setStrikePrice] = useState('');

//   // active bet
//   const [activeBet, setActiveBet] = useState(null); // {direction, amount, entryPrice, entryTime, duration, strike}
//   const [timeLeft, setTimeLeft] = useState(0);
//   const timerRef = useRef(null);

//   // history
//   const [betHistory, setBetHistory] = useState([]);
//   const [loadingHistory, setLoadingHistory] = useState(true);

//   // chart container
//   const chartContainerRef = useRef();
//   const { setCandles, updateLast, addMarker, clearMarkers } = useLightweightChart(chartContainerRef);

//   // track last known live price in ref to avoid closure issues
//   const livePriceRef = useRef(null);
//   useEffect(() => { livePriceRef.current = livePrice; }, [livePrice]);

//   // subscribe to live price
//   useEffect(() => {
//     setConnecting(true);
//     const unsub = priceFeed.subscribe(selectedValue, ({ price }) => {
//       setLivePrice(price);
//       setConnecting(false);
//     });
//     return () => { try { unsub(); } catch (e) {} };
//   }, [selectedValue]);

//   // fetch initial candles for chart (use Binance REST or a fallback) — here we fetch last-minute candles via a simple approach
//   useEffect(() => {
//     const loadHistoryCandles = async () => {
//       try {
//         // Try Binance REST Klines (no API key) for 500 1-min candles
//         const { provider, symbol } = normalizePair(selectedValue);
//         if (provider === 'BINANCE') {
//           const binSym = toBinanceSymbol(symbol);
//           const url = `https://api.binance.com/api/v3/klines?symbol=${binSym}&interval=1m&limit=500`;
//           const r = await fetch(url);
//           if (!r.ok) throw new Error('klines failed');
//           const data = await r.json();
//           // convert to lightweight-candles
//           const candles = data.map((c) => ({ time: Math.floor(c[0] / 1000), open: parseFloat(c[1]), high: parseFloat(c[2]), low: parseFloat(c[3]), close: parseFloat(c[4]) }));
//           setCandles(candles);
//           // set last price as last close
//           if (candles.length) {
//             const last = candles[candles.length - 1].close;
//             setLivePrice(last);
//           }
//         } else {
//           // fallback: simulate small candles if no endpoint
//           const now = Math.floor(Date.now() / 1000);
//           const candles = Array.from({ length: 200 }).map((_, i) => {
//             const t = now - (200 - i) * 60;
//             const price = 100 + Math.sin(i / 10) * 2 + i * 0.01;
//             return { time: t, open: price * 0.995, high: price * 1.005, low: price * 0.99, close: price };
//           });
//           setCandles(candles);
//           setLivePrice(candles[candles.length - 1].close);
//         }
//       } catch (err) {
//         console.error('Failed to load candles', err);
//       }
//     };
//     loadHistoryCandles();
//   }, [selectedValue, setCandles]);

//   // when livePrice updates, update last candle in chart
//   useEffect(() => {
//     if (!livePrice) return;
//     const nowSec = Math.floor(Date.now() / 1000);
//     // create a bar for current minute (simple approach)
//     const bar = { time: nowSec, open: livePrice, high: livePrice, low: livePrice, close: livePrice };
//     try { updateLast(bar); } catch (e) {}
//   }, [livePrice, updateLast]);

//   // load bet history from server
//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       try {
//         const res = await fetch('/api/stocks/find', { 
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ id: auth.user._id })
//         });
//         const data = await res.json();
  
//         const fmt = (d) => ({
//           time: new Date(d.date).toLocaleString(),
//           direction: d.data?.direction || '-',
//           result: d.data?.outcome === 'stopped' 
//                     ? 'Stopped (Loss)' 
//                     : (d.data?.outcome || '-'),
//           entryPrice: parseFloat(d.price) || 0,
//           resultPrice: d.data?.resultPrice 
//                          ? parseFloat(d.data.resultPrice) 
//                          : null,
//           amount: parseFloat(d.value) || 0,
//           pair: d.ticker,
//           rawDate: new Date(d.date)   // keep original Date object
//         });
  
//         // get today’s date (at midnight)
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
  
//         if (mounted) {
//           const todayBets = (data || [])
//             .map(fmt)
//             .filter(bet => bet.rawDate >= today); // only today’s bets
//           setBetHistory(todayBets);
//         }
//       } catch (e) {
//         console.error(e);
//       } finally {
//         if (mounted) setLoadingHistory(false);
//       }
//     })();
//     return () => { mounted = false; };
//   }, [auth.user._id]);
  

//   // robust function to capture immediate live price (using ref)
//   const getLatestPrice = useCallback(() => livePriceRef.current ?? livePrice, [livePrice]);

//   // start the countdown and ensure entry captured and exit captured
//   const beginBet = useCallback((bet) => {
//     // bet: { direction, amount, entryPrice, duration, strike }
//     setActiveBet(bet);
//     setTimeLeft(bet.duration);

//     // add entry marker to chart
//     try {
//       addMarker({ time: Math.floor(Date.now() / 1000), position: bet.direction === 'up' ? 'belowBar' : 'aboveBar', color: bet.direction === 'up' ? '#4caf50' : '#f44336', shape: 'arrowUp', text: `Entry ${fmt(bet.entryPrice)}` });
//     } catch (e) { console.error(e); }

//     // timer
//     let seconds = bet.duration;
//     timerRef.current = setInterval(async () => {
//       const current = getLatestPrice();

//       // stop loss check
//       if (stopLossEnabled && stopLossAmount > 0) {
//         const priceMovement = bet.direction === 'up' ? (bet.entryPrice - current) : (current - bet.entryPrice);
//         if (priceMovement >= stopLossAmount) {
//           clearInterval(timerRef.current);
//           timerRef.current = null;
//           // finalize as stopped
//           await finalizeBet('stopped', current, bet);
//           return;
//         }
//       }

//       if (seconds <= 1) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//         const didWin = (bet.direction === 'up' && current > bet.entryPrice) || (bet.direction === 'down' && current < bet.entryPrice);
//         await finalizeBet(didWin ? 'won' : 'lost', current, bet);
//       } else {
//         seconds -= 1;
//         setTimeLeft(seconds);
//       }
//     }, 1000);
//   }, [addMarker, getLatestPrice, stopLossAmount, stopLossEnabled]);

//   // finalize bet: save and add exit marker
//   const finalizeBet = useCallback(async (outcome, exitPrice, bet) => {
//     // add exit marker
//     try {
//       addMarker({ time: Math.floor(Date.now() / 1000), position: bet.direction === 'up' ? 'aboveBar' : 'belowBar', color: '#2196f3', shape: 'arrowDown', text: `Exit ${fmt(exitPrice)}` });
//     } catch (e) { console.error(e); }

//     // payload to server
//     const payload = { value: bet.amount, price: bet.entryPrice, quantity: 1, ticker: selectedValue, data: { resultPrice: exitPrice, direction: bet.direction, outcome } };
//     try {
//       await buyStock(payload);
//       const rec = { time: new Date().toLocaleString(), direction: bet.direction, result: outcome === 'stopped' ? 'Stopped (Loss)' : outcome, entryPrice: bet.entryPrice, resultPrice: exitPrice, amount: bet.amount, pair: selectedValue };
//       setBetHistory((p) => [rec, ...p]);
//       // message
//       // eslint-disable-next-line no-console
//       console.log('Bet saved', rec);
//     } catch (err) {
//       console.error('Error saving bet', err);
//     } finally {
//       setActiveBet(null);
//       setTimeLeft(0);
//       // refresh balance
//       try { await refreshUserData(); } catch (e) {}
//     }
//   }, [addMarker, buyStock, refreshUserData, selectedValue]);

//   // start bet (handles strike)
//   const startBet = useCallback(async (direction) => {
//     setActiveBet(null);
//     setTimeLeft(0);

//     const balance = auth.user?.balance || 0;
//     if (!betAmount || betAmount <= 0) return alert('Bet amount must be > 0');
//     if (betAmount > balance) return alert('Insufficient balance');

//     const strike = strikePrice ? parseFloat(strikePrice) : null;
//     if (strike && isFinite(strike)) {
//       // subscribe for crossing
//       const key = selectedValue;
//       const unsub = priceFeed.subscribe(key, ({ price }) => {
//         if (!isFinite(price)) return;
//         const crossed = (direction === 'up' && price >= strike) || (direction === 'down' && price <= strike);
//         if (crossed) {
//           try { unsub(); } catch (e) {}
//           // entry price is price at crossing
//           const bet = { direction, amount: betAmount, entryPrice: price, duration: betDuration, strike };
//           beginBet(bet);
//         }
//       });
//       return;
//     }

//     // immediate
//     const current = getLatestPrice();
//     if (!isFinite(current)) return alert('Current price unavailable');
//     const bet = { direction, amount: betAmount, entryPrice: current, duration: betDuration, strike: null };
//     beginBet(bet);
//   }, [auth.user, betAmount, betDuration, beginBet, getLatestPrice, selectedValue, strikePrice]);

//   // cleanup on unmount
//   useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

//   // UI helpers
//   const renderHistoryItem = (h, idx) => (
//     <div key={idx} style={{ padding: 8, marginBottom: 6, borderRadius: 6, background: '#141414' }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//         <strong>{h.pair}</strong>
//         <span style={{ color: '#aaa' }}>{h.time}</span>
//       </div>
//       <div>Dir: <b>{h.direction?.toUpperCase()}</b> • Amount: <b>${(h.amount||0).toFixed(2)}</b></div>
//       <div>Entry: ${fmt(h.entryPrice)} → Exit: ${fmt(h.resultPrice)}</div>
//       <div>Result: <b>{h.result}</b></div>
//     </div>
//   );

//   return (
//     <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff' }}>
//       <NavBar />
//       <Container fluid className='py-4'>
//         <Row>
//           <Col md={4}>
//             <div style={{ padding: 16, borderRadius: 10, background: 'linear-gradient(180deg,#171717,#0f0f0f)', border: '1px solid #ffc107' }}>
//               <h4 style={{ color: '#ffc107', textAlign: 'center' }}>📈 Trading Panel</h4>
//               <div style={{ marginTop: 8 }}>
//                 <div style={{ color: '#ccc' }}>Balance</div>
//                 <div style={{ color: '#28a745', fontWeight: 700 }}>${Number(auth.user?.balance || 0).toFixed(2)}</div>
//               </div>

//               <Form.Group className='mt-3'>
//                 <Form.Label style={{ color: '#ccc' }}>Asset</Form.Label>
//                 <Form.Control as='select' value={selectedValue} onChange={(e) => setSelectedValue(e.target.value)} disabled={!!activeBet}>
//                   {Array.from(new Set(AVAILABLE_PAIRS.map(p => p.group))).map(g => (
//                     <optgroup key={g} label={g}>{AVAILABLE_PAIRS.filter(p => p.group === g).map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</optgroup>
//                   ))}
//                 </Form.Control>
//               </Form.Group>

//               <div style={{ marginTop: 12 }}>Current Price: <strong>${fmt(livePrice)}</strong> {connecting && <Spinner size='sm' animation='border' />}</div>

//               <Form.Group className='mt-3'>
//                 <Form.Label>Bet Amount</Form.Label>
//                 <Form.Control type='number' min='0' value={betAmount} onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)} disabled={!!activeBet} />
//               </Form.Group>

//               <Form.Group className='mt-3'>
//                 <Form.Label>Duration (sec)</Form.Label>
//                 <Form.Control as='select' value={betDuration} onChange={(e) => setBetDuration(parseInt(e.target.value) || 5)} disabled={!!activeBet}>
//                   {[5,10,15,30,60].map(t => <option key={t} value={t}>{t} sec</option>)}
//                 </Form.Control>
//               </Form.Group>

//               <Form.Group className='mt-3'>
//                 <Form.Label>Strike / Trigger Price (optional)</Form.Label>
//                 <Form.Control value={strikePrice} onChange={(e) => setStrikePrice(e.target.value)} placeholder='Leave empty to start immediately' disabled={!!activeBet} />
//               </Form.Group>

//               <Form.Group className='mt-3'>
//                 <Form.Check label='Enable Stop Loss' checked={stopLossEnabled} onChange={(e) => setStopLossEnabled(e.target.checked)} disabled={!!activeBet} />
//               </Form.Group>

//               {stopLossEnabled && (
//                 <Form.Group className='mt-2'>
//                   <Form.Label>Stop Loss Amount (absolute)</Form.Label>
//                   <Form.Control type='number' min='0' value={stopLossAmount} onChange={(e) => setStopLossAmount(parseFloat(e.target.value) || 0)} disabled={!!activeBet} />
//                 </Form.Group>
//               )}

//               <Row className='mt-3'>
//                 <Col>
//                   <Button variant='outline-success' onClick={() => startBet('up')} disabled={!!activeBet} style={{ width: '100%' }}>Buy</Button>
//                 </Col>
//                 <Col>
//                   <Button variant='outline-danger' onClick={() => startBet('down')} disabled={!!activeBet} style={{ width: '100%' }}>Sell</Button>
//                 </Col>
//               </Row>

//               {activeBet && (
//                 <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#111' }}>
//                   <div style={{ fontSize: 14, color: '#ccc' }}>Active Bet</div>
//                   <div style={{ fontWeight: 700 }}>{selectedValue} • {activeBet.direction.toUpperCase()}</div>
//                   <div>Entry: ${fmt(activeBet.entryPrice)} • Amount: ${activeBet.amount.toFixed(2)}</div>
//                   <div>Time left: {timeLeft}s</div>
//                 </div>
//               )}

//               <div style={{ marginTop: 12 }}>
//                 <h6 style={{ color: '#ccc' }}>Bet History</h6>
//                 <div style={{ maxHeight: 300, overflowY: 'auto' }}>{loadingHistory ? <div style={{ color: '#888' }}><Spinner size='sm' animation='border' /> Loading...</div> : (betHistory.length === 0 ? <div style={{ color: '#888' }}>No bets yet</div> : betHistory.map(renderHistoryItem))}</div>
//               </div>
//             </div>
//           </Col>

//           <Col md={8}>
//             <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
//               {activeBet && (
//                 <div style={{ padding: 10 }}>
//                   <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
//                     <div>
//                       <div style={{ color: '#ccc' }}>Active Trade</div>
//                       <div style={{ fontWeight:700 }}>{selectedValue} • {activeBet.direction.toUpperCase()}</div>
//                     </div>
//                     <div style={{ textAlign: 'right' }}>
//                       <div style={{ fontWeight:700, fontSize: 18 }}>${fmt(livePrice)}</div>
//                       <div style={{ color: (activeBet.direction === 'up' ? (livePrice > activeBet.entryPrice ? '#0f0' : '#f33') : (livePrice < activeBet.entryPrice ? '#0f0' : '#f33')), fontWeight:700 }}>{ (() => { const d = safeNumber(livePrice) !== null ? livePrice - activeBet.entryPrice : null; return d !== null ? `${d >= 0 ? '+' : ''}${fmt(d)}` : '-' })() }</div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div ref={chartContainerRef} style={{ height: 520, borderRadius: 8, overflow: 'hidden' }} />

//               <div style={{ display:'flex', justifyContent:'space-between' }}>
//                 <div style={{ color:'#888' }}>Chart powered by lightweight-charts; markers show entry & exit.</div>
//                 <div>
//                   <Button variant='secondary' onClick={() => { priceFeed.connect(); setConnecting(true); }}>Reconnect Feed</Button>
//                 </div>
//               </div>
//             </div>
//           </Col>
//         </Row>
//       </Container>
//       <Footerv2 />
//     </div>
//   );
// };

// LiveTradingWithChartMarkers.propTypes = { auth: PropTypes.object.isRequired, refreshUserData: PropTypes.func.isRequired, buyStock: PropTypes.func.isRequired };

// const mapStateToProps = (state) => ({ auth: state.auth, user: state.user });
// export default connect(mapStateToProps, { refreshUserData, buyStock })(LiveTradingWithChartMarkers);
/*
  LiveTradingWithChartMarkers.js
  (Updated: fixes strike duplicate-bet race + allows cancelling/editing while waiting)
*/

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

// ------------------- Price Feed Manager (singleton) -------------------
class PriceFeedManager {
  constructor() {
    this.binancePrices = new Map();
    this.subscribers = new Map(); // key -> Set(cb)
    this.ws = null;
    this.reconnectAttempt = 0;

    this.connect();
  }

  connect() {
    try {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
      this.ws = new WebSocket(BINANCE_WS_URL);

      this.ws.onopen = () => {
        this.reconnectAttempt = 0;
        console.info('Binance WS open');
      };

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
        } catch (err) {
          console.error('WS parse error', err);
        }
      };

      this.ws.onclose = () => {
        this.reconnectAttempt += 1;
        const delay = Math.min(30000, 500 * Math.pow(2, this.reconnectAttempt));
        console.warn('WS closed, reconnect in', delay);
        setTimeout(() => this.connect(), delay);
      };

      this.ws.onerror = (err) => console.warn('WS err', err);
    } catch (err) {
      console.error('WS connect err', err);
    }
  }

  subscribe(key, cb) {
    if (!this.subscribers.has(key)) this.subscribers.set(key, new Set());
    this.subscribers.get(key).add(cb);

    // immediate emit if we have price
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

// ------------------- Chart Helper (Lightweight) -------------------
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

  const setCandles = useCallback((candles) => {
    if (seriesRef.current) seriesRef.current.setData(candles);
  }, []);

  const updateLast = useCallback((bar) => {
    if (seriesRef.current) seriesRef.current.update(bar);
  }, []);

  const addMarker = useCallback((marker) => {
    markersRef.current.push(marker);
    if (seriesRef.current) seriesRef.current.setMarkers([...markersRef.current]);
  }, []);

  const clearMarkers = useCallback(() => {
    markersRef.current = [];
    if (seriesRef.current) seriesRef.current.setMarkers([]);
  }, []);

  return { setCandles, updateLast, addMarker, clearMarkers, chartRef, seriesRef };
};

// ------------------- Main Component -------------------
const LiveTradingWithChartMarkers = ({ auth, refreshUserData, buyStock }) => {
  const [selectedValue, setSelectedValue] = useState(AVAILABLE_PAIRS[0].value);
  const [livePrice, setLivePrice] = useState(null);
  const [connecting, setConnecting] = useState(true);

  // bet form
  const [betAmount, setBetAmount] = useState(10);
  const [betDuration, setBetDuration] = useState(5);
  const [stopLossEnabled, setStopLossEnabled] = useState(false);
  const [stopLossAmount, setStopLossAmount] = useState(0);
  const [strikePrice, setStrikePrice] = useState('');

  // active bet
  const [activeBet, setActiveBet] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // history
  const [betHistory, setBetHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // waiting-for-strike and guard
  const [waitingForStrike, setWaitingForStrike] = useState(false);
  const hasTriggeredRef = useRef(false);
  const strikeUnsubRef = useRef(null);

  // chart
  const chartContainerRef = useRef();
  const { setCandles, updateLast, addMarker } = useLightweightChart(chartContainerRef);

  // last live price ref
  const livePriceRef = useRef(null);
  useEffect(() => { livePriceRef.current = livePrice; }, [livePrice]);

  // Subscribe to live price feed for selected asset
  useEffect(() => {
    setConnecting(true);
    const unsub = priceFeed.subscribe(selectedValue, ({ price }) => {
      setLivePrice(price);
      setConnecting(false);
    });
    return () => { try { unsub(); } catch (e) {} };
  }, [selectedValue]);

  // Fetch candles on symbol change
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
          const candles = data.map((c) => ({
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
      } catch (err) {
        console.error('Failed to load candles', err);
      }
    };
    loadHistoryCandles();
  }, [selectedValue, setCandles]);

  // Update last candle as ticks come
  useEffect(() => {
    if (!safeNumber(livePrice)) return;
    const nowSec = Math.floor(Date.now() / 1000);
    const bar = { time: nowSec, open: livePrice, high: livePrice, low: livePrice, close: livePrice };
    try { updateLast(bar); } catch (e) {}
  }, [livePrice, updateLast]);

  // Load today's bet history
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
        const fmt = (d) => ({
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
          const todayBets = (data || []).map(fmt).filter(b => b.rawDate >= today);
          setBetHistory(todayBets);
        }
      } catch (e) { console.error(e); }
      finally { if (mounted) setLoadingHistory(false); }
    })();
    return () => { mounted = false; };
  }, [auth.user._id]);

  // get latest price safely
  const getLatestPrice = useCallback(() => livePriceRef.current ?? livePrice, [livePrice]);

  // Helper: clear strike subscription
  const clearStrikeSubscription = useCallback(() => {
    if (strikeUnsubRef.current) {
      try { strikeUnsubRef.current(); } catch (e) {}
      strikeUnsubRef.current = null;
    }
  }, []);

  // When selectedValue or strikePrice changes, cancel any pending strike (user editing cancels)
  useEffect(() => {
    // If user edits asset or strike while waiting, cancel previous wait.
    if (waitingForStrike) {
      clearStrikeSubscription();
      hasTriggeredRef.current = false;
      setWaitingForStrike(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValue, strikePrice]);

  // beginBet: starts countdown and places entry marker
  const beginBet = useCallback((bet) => {
    setActiveBet(bet);
    setTimeLeft(bet.duration);

    try {
      addMarker({
        time: Math.floor(Date.now() / 1000),
        position: bet.direction === 'up' ? 'belowBar' : 'aboveBar',
        color: bet.direction === 'up' ? '#4caf50' : '#f44336',
        shape: 'arrowUp',
        text: `Entry ${fmt(bet.entryPrice)}`
      });
    } catch (e) { console.error(e); }

    let seconds = bet.duration;
    timerRef.current = setInterval(async () => {
      const current = getLatestPrice();

      if (stopLossEnabled && stopLossAmount > 0 && safeNumber(current) !== null) {
        const priceMovement = bet.direction === 'up' ? (bet.entryPrice - current) : (current - bet.entryPrice);
        if (priceMovement >= stopLossAmount) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          await finalizeBet('stopped', current, bet);
          return;
        }
      }

      if (seconds <= 1) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        const didWin = (bet.direction === 'up' && current > bet.entryPrice) || (bet.direction === 'down' && current < bet.entryPrice);
        await finalizeBet(didWin ? 'won' : 'lost', current, bet);
      } else {
        seconds -= 1;
        setTimeLeft(seconds);
      }
    }, 1000);
  }, [addMarker, getLatestPrice, stopLossAmount, stopLossEnabled]);

  // finalizeBet: exit marker, save, refresh
  const finalizeBet = useCallback(async (outcome, exitPrice, bet) => {
    try {
      addMarker({
        time: Math.floor(Date.now() / 1000),
        position: bet.direction === 'up' ? 'aboveBar' : 'belowBar',
        color: '#2196f3',
        shape: 'arrowDown',
        text: `Exit ${fmt(exitPrice)}`
      });
    } catch (e) { console.error(e); }

    const payload = { value: bet.amount, price: bet.entryPrice, quantity: 1, ticker: selectedValue, data: { resultPrice: exitPrice, direction: bet.direction, outcome } };
    try {
      await buyStock(payload);
      const rec = { time: new Date().toLocaleString(), direction: bet.direction, result: outcome === 'stopped' ? 'Stopped (Loss)' : outcome, entryPrice: bet.entryPrice, resultPrice: exitPrice, amount: bet.amount, pair: selectedValue };
      setBetHistory((p) => [rec, ...p]);
      console.log('Bet saved', rec);
    } catch (err) {
      console.error('Error saving bet', err);
    } finally {
      setActiveBet(null);
      setTimeLeft(0);
      hasTriggeredRef.current = false;
      clearStrikeSubscription();
      setWaitingForStrike(false);
      try { await refreshUserData(); } catch (e) {}
    }
  }, [addMarker, buyStock, refreshUserData, selectedValue, clearStrikeSubscription]);

  // startBet: immediate or strike-based start
  const startBet = useCallback(async (direction) => {
    if (activeBet) return alert('A bet is already active');
    setActiveBet(null);
    setTimeLeft(0);

    const balance = auth.user?.balance || 0;
    if (!betAmount || betAmount <= 0) return alert('Bet amount must be > 0');
    if (betAmount > balance) return alert('Insufficient balance');

    const strike = strikePrice ? parseFloat(strikePrice) : null;
    if (strike && isFinite(strike)) {
      // cancel any previous subscription first
      clearStrikeSubscription();
      hasTriggeredRef.current = false;
      setWaitingForStrike(true);

      const key = selectedValue;
      const unsub = priceFeed.subscribe(key, ({ price }) => {
        if (!isFinite(price)) return;

        // If already triggered, ignore
        if (hasTriggeredRef.current) return;

        // Check crossing
        const crossed = (direction === 'up' && price >= strike) || (direction === 'down' && price <= strike);
        if (crossed) {
          // Immediately set guard to prevent any race
          hasTriggeredRef.current = true;
          // Unsubscribe immediately
          try { unsub(); } catch (e) {}
          strikeUnsubRef.current = null;
          setWaitingForStrike(false);

          // Begin bet with entry price at crossing
          const bet = { direction, amount: betAmount, entryPrice: price, duration: betDuration, strike };
          beginBet(bet);
        }
      });

      strikeUnsubRef.current = unsub;
      return;
    }

    // immediate start (no strike)
    const current = getLatestPrice();
    if (!isFinite(current)) return alert('Current price unavailable');
    const bet = { direction, amount: betAmount, entryPrice: current, duration: betDuration, strike: null };
    beginBet(bet);
  }, [activeBet, auth.user, betAmount, betDuration, beginBet, clearStrikeSubscription, getLatestPrice, selectedValue, strikePrice]);

  // Cancel pending strike (user-driven)
  const cancelPending = useCallback(() => {
    clearStrikeSubscription();
    hasTriggeredRef.current = false;
    setWaitingForStrike(false);
  }, [clearStrikeSubscription]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearStrikeSubscription();
    };
  }, [clearStrikeSubscription]);

  // History item renderer
  const renderHistoryItem = (h, idx) => (
    <div key={idx} style={{ padding: 8, marginBottom: 6, borderRadius: 6, background: '#141414' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong>{h.pair}</strong>
        <span style={{ color: '#aaa' }}>{h.time}</span>
      </div>
      <div>Dir: <b>{h.direction?.toUpperCase()}</b> • Amount: <b>${(h.amount||0).toFixed(2)}</b></div>
      <div>Entry: ${fmt(h.entryPrice)} → Exit: ${fmt(h.resultPrice)}</div>
      <div>Result: <b>{h.result}</b></div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff' }}>
      <NavBar />
      <Container fluid className='py-4'>
        <Row>
          <Col md={4}>
            <div style={{ padding: 16, borderRadius: 10, background: 'linear-gradient(180deg,#171717,#0f0f0f)', border: '1px solid #ffc107' }}>
              <h4 style={{ color: '#ffc107', textAlign: 'center' }}>📈 Trading Panel</h4>

              <div style={{ marginTop: 8 }}>
                <div style={{ color: '#ccc' }}>Balance</div>
                <div style={{ color: '#28a745', fontWeight: 700 }}>${Number(auth.user?.balance || 0).toFixed(2)}</div>
              </div>

              <Form.Group className='mt-3'>
                <Form.Label style={{ color: '#ccc' }}>Asset</Form.Label>
                {/* Allow editing asset even when waiting; editing cancels pending automatically */}
                <Form.Control
                  as='select'
                  value={selectedValue}
                  onChange={(e) => setSelectedValue(e.target.value)}
                  disabled={!!activeBet}
                >
                  {Array.from(new Set(AVAILABLE_PAIRS.map(p => p.group))).map(g => (
                    <optgroup key={g} label={g}>
                      {AVAILABLE_PAIRS.filter(p => p.group === g).map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </optgroup>
                  ))}
                </Form.Control>
              </Form.Group>

              <div style={{ marginTop: 12 }}>
                Current Price: <strong>${fmt(livePrice)}</strong> {connecting && <Spinner size='sm' animation='border' />}
              </div>

              <Form.Group className='mt-3'>
                <Form.Label>Bet Amount</Form.Label>
                <Form.Control
                  type='number'
                  min='0'
                  value={betAmount}
                  onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                  disabled={!!activeBet}
                />
              </Form.Group>

              <Form.Group className='mt-3'>
                <Form.Label>Duration (sec)</Form.Label>
                <Form.Control
                  as='select'
                  value={betDuration}
                  onChange={(e) => setBetDuration(parseInt(e.target.value) || 5)}
                  disabled={!!activeBet}
                >
                  {[5,10,15,30,60].map(t => <option key={t} value={t}>{t} sec</option>)}
                </Form.Control>
              </Form.Group>

              <Form.Group className='mt-3'>
                <Form.Label>Strike / Trigger Price (optional)</Form.Label>
                {/* Allow editing strike while waiting — editing cancels previous pending subscription */}
                <Form.Control
                  value={strikePrice}
                  onChange={(e) => setStrikePrice(e.target.value)}
                  placeholder='Leave empty to start immediately'
                  disabled={!!activeBet}
                />
              </Form.Group>

              <Form.Group className='mt-3'>
                <Form.Check label='Enable Stop Loss' checked={stopLossEnabled} onChange={(e) => setStopLossEnabled(e.target.checked)} disabled={!!activeBet} />
              </Form.Group>

              {stopLossEnabled && (
                <Form.Group className='mt-2'>
                  <Form.Label>Stop Loss Amount (absolute)</Form.Label>
                  <Form.Control type='number' min='0' value={stopLossAmount} onChange={(e) => setStopLossAmount(parseFloat(e.target.value) || 0)} disabled={!!activeBet} />
                </Form.Group>
              )}

              <Row className='mt-3'>
                <Col>
                  <Button variant='outline-success' onClick={() => startBet('up')} disabled={!!activeBet} style={{ width: '100%' }}>
                    Buy
                  </Button>
                </Col>
                <Col>
                  <Button variant='outline-danger' onClick={() => startBet('down')} disabled={!!activeBet} style={{ width: '100%' }}>
                    Sell
                  </Button>
                </Col>
              </Row>

              {/* When waiting for strike — show clear Cancel button and message (inputs remain editable) */}
              {waitingForStrike && (
                <div style={{ marginTop: 12 }}>
                  <Alert variant='warning' className='mb-2' style={{ padding: '8px 12px' }}>
                    Waiting for price to reach strike <strong>{strikePrice}</strong>. You can edit asset/strike to cancel or press Cancel.
                  </Alert>
                  <Button variant='outline-light' onClick={cancelPending} style={{ width: '100%' }}>Cancel Pending Strike</Button>
                </div>
              )}

              {activeBet && (
                <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#111' }}>
                  <div style={{ fontSize: 14, color: '#ccc' }}>Active Bet</div>
                  <div style={{ fontWeight: 700 }}>{selectedValue} • {activeBet.direction.toUpperCase()}</div>
                  <div>Entry: ${fmt(activeBet.entryPrice)} • Amount: ${activeBet.amount.toFixed(2)}</div>
                  <div>Time left: {timeLeft}s</div>
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <h6 style={{ color: '#ccc' }}>Bet History (Today)</h6>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {loadingHistory ? <div style={{ color: '#888' }}><Spinner size='sm' animation='border' /> Loading...</div> : (betHistory.length === 0 ? <div style={{ color: '#888' }}>No bets yet</div> : betHistory.map(renderHistoryItem))}
                </div>
              </div>
            </div>
          </Col>

          <Col md={8}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeBet && (
                <div style={{ padding: 10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ color: '#ccc' }}>Active Trade</div>
                      <div style={{ fontWeight:700 }}>{selectedValue} • {activeBet.direction.toUpperCase()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight:700, fontSize: 18 }}>${fmt(livePrice)}</div>
                      <div style={{ color: (activeBet.direction === 'up' ? (livePrice > activeBet.entryPrice ? '#0f0' : '#f33') : (livePrice < activeBet.entryPrice ? '#0f0' : '#f33')), fontWeight:700 }}>
                        { (() => { const d = safeNumber(livePrice) !== null ? livePrice - activeBet.entryPrice : null; return d !== null ? `${d >= 0 ? '+' : ''}${fmt(d)}` : '-' })() }
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chartContainerRef} style={{ height: 520, borderRadius: 8, overflow: 'hidden' }} />

              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <div style={{ color:'#888' }}>Chart powered by lightweight-charts; markers show entry & exit.</div>
                <div>
                  <Button variant='secondary' onClick={() => { priceFeed.connect(); setConnecting(true); }}>Reconnect Feed</Button>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
      <Footerv2 />
    </div>
  );
};

LiveTradingWithChartMarkers.propTypes = { auth: PropTypes.object.isRequired, refreshUserData: PropTypes.func.isRequired, buyStock: PropTypes.func.isRequired };

const mapStateToProps = (state) => ({ auth: state.auth, user: state.user });
export default connect(mapStateToProps, { refreshUserData, buyStock })(LiveTradingWithChartMarkers);
