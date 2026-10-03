import * as ct from "countries-and-timezones"

export const getCountryFromTimezone = (timezone?: string) => {
  if (!timezone) {
    return null
  }

  const timezoneInfo = ct.getTimezone(timezone)
  /*
Sample timezoneInfo
{
  name: 'America/Los_Angeles',
  countries: [ 'US' ],
  utcOffset: -480,
  utcOffsetStr: '-08:00',
  dstOffset: -420,
  dstOffsetStr: '-07:00',
  aliasOf: null
}
*/
  if (!timezoneInfo?.countries?.length) {
    return null
  }

  const countryCode = timezoneInfo.countries[0]
  const country = ct.getCountry(countryCode as string)
  /*
{
  id: 'DE',
  name: 'Germany',
  timezones: [ 'Europe/Berlin', 'Europe/Zurich' ]
}
*/

  return {
    code: countryCode,
    name: country?.name || countryCode,
  }
}

export const getCountryFlagUrl = (countryCode: string) => {
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`
}
