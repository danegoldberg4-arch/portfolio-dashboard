// Market Hours Utility
// Determines if a market is currently open based on timezone and trading hours

function isMarketOpen(market) {
  const now = new Date();
  
  // Get current time in different timezones
  const usEasternTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const australianTime = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
  const hongKongTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }));
  
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  switch (market) {
    case 'US':
      // NYSE/NASDAQ: Monday-Friday, 9:30 AM - 4:00 PM ET
      if (day === 0 || day === 6) return false; // Weekend
      
      const usHour = usEasternTime.getHours();
      const usMinute = usEasternTime.getMinutes();
      const usTime = usHour * 60 + usMinute;
      
      const marketOpen = 9 * 60 + 30; // 9:30 AM
      const marketClose = 16 * 60; // 4:00 PM
      
      return usTime >= marketOpen && usTime < marketClose;
      
    case 'ASX':
      // ASX: Monday-Friday, 10:00 AM - 4:00 PM AEDT/AEST
      if (day === 0 || day === 6) return false; // Weekend
      
      const ausHour = australianTime.getHours();
      const ausTime = ausHour * 60 + australianTime.getMinutes();
      
      const asxOpen = 10 * 60; // 10:00 AM
      const asxClose = 16 * 60; // 4:00 PM
      
      return ausTime >= asxOpen && ausTime < asxClose;
      
    case 'HK':
      // HKEX: Monday-Friday, 9:30 AM - 12:00 PM, 1:00 PM - 4:00 PM HKT
      if (day === 0 || day === 6) return false; // Weekend
      
      const hkHour = hongKongTime.getHours();
      const hkTime = hkHour * 60 + hongKongTime.getMinutes();
      
      const morningOpen = 9 * 60 + 30; // 9:30 AM
      const morningClose = 12 * 60; // 12:00 PM
      const afternoonOpen = 13 * 60; // 1:00 PM
      const afternoonClose = 16 * 60; // 4:00 PM
      
      return (hkTime >= morningOpen && hkTime < morningClose) ||
             (hkTime >= afternoonOpen && hkTime < afternoonClose);
      
    default:
      return false;
  }
}

function isUSMarketHoliday(date) {
  // Major US market holidays (add more as needed)
  const holidays = [
    '2026-01-01', // New Year's Day
    '2026-01-19', // MLK Day
    '2026-02-16', // Presidents Day
    '2026-04-10', // Good Friday
    '2026-05-25', // Memorial Day
    '2026-07-03', // Independence Day (observed)
    '2026-09-07', // Labor Day
    '2026-11-26', // Thanksgiving
    '2026-12-25', // Christmas
  ];
  
  const dateStr = date.toISOString().split('T')[0];
  return holidays.includes(dateStr);
}

function isASXMarketHoliday(date) {
  // Major ASX holidays (add more as needed)
  const holidays = [
    '2026-01-01', // New Year's Day
    '2026-01-26', // Australia Day
    '2026-04-10', // Good Friday
    '2026-04-13', // Easter Monday
    '2026-04-25', // ANZAC Day
    '2026-06-08', // Queen's Birthday
    '2026-12-25', // Christmas Day
    '2026-12-26', // Boxing Day
  ];
  
  const dateStr = date.toISOString().split('T')[0];
  return holidays.includes(dateStr);
}

function shouldFetchMarket(market) {
  const now = new Date();
  
  // Check if it's a holiday
  if (market === 'US' && isUSMarketHoliday(now)) {
    console.log(`[Market Hours] US market closed (holiday)`);
    return false;
  }
  
  if (market === 'ASX' && isASXMarketHoliday(now)) {
    console.log(`[Market Hours] ASX market closed (holiday)`);
    return false;
  }
  
  // Check if market is open
  const isOpen = isMarketOpen(market);
  
  if (!isOpen) {
    console.log(`[Market Hours] ${market} market is currently closed`);
  } else {
    console.log(`[Market Hours] ${market} market is OPEN - fetching prices`);
  }
  
  return isOpen;
}

function getNextMarketOpen(market) {
  const now = new Date();
  let nextOpen = new Date(now);
  
  // Simplified - just get next weekday at market open time
  nextOpen.setDate(nextOpen.getDate() + 1);
  while (nextOpen.getDay() === 0 || nextOpen.getDay() === 6) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }
  
  switch (market) {
    case 'US':
      nextOpen.setHours(9, 30, 0, 0);
      break;
    case 'ASX':
      nextOpen.setHours(10, 0, 0, 0);
      break;
    case 'HK':
      nextOpen.setHours(9, 30, 0, 0);
      break;
  }
  
  return nextOpen;
}

function getMarketStatus() {
  return {
    US: {
      isOpen: shouldFetchMarket('US'),
      nextOpen: isMarketOpen('US') ? null : getNextMarketOpen('US')
    },
    ASX: {
      isOpen: shouldFetchMarket('ASX'),
      nextOpen: isMarketOpen('ASX') ? null : getNextMarketOpen('ASX')
    },
    HK: {
      isOpen: shouldFetchMarket('HK'),
      nextOpen: isMarketOpen('HK') ? null : getNextMarketOpen('HK')
    }
  };
}

module.exports = {
  isMarketOpen,
  shouldFetchMarket,
  getMarketStatus,
  isUSMarketHoliday,
  isASXMarketHoliday
};
