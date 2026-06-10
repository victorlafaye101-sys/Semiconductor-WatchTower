import { fetchEtfQuoteLive } from "../services/etfQuote.ts";
import { fetchEtfHistory } from "../services/etfHistory.ts";

const live = await fetchEtfQuoteLive();
const history = await fetchEtfHistory(live.price);
console.log(
  JSON.stringify(
    {
      price: live.price,
      periods: history.periods,
      history30d: history.history30d,
      volume: history.volume,
    },
    null,
    2,
  ),
);
