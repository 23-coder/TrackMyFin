package com.financetracker.entity;

public enum Currency {
    USD("US Dollar", "$", "en-US"),
    EUR("Euro", "€", "en-IE"),
    GBP("British Pound", "£", "en-GB"),
    INR("Indian Rupee", "₹", "en-IN"),
    JPY("Japanese Yen", "¥", "ja-JP"),
    CAD("Canadian Dollar", "$", "en-CA"),
    AUD("Australian Dollar", "$", "en-AU"),
    CHF("Swiss Franc", "CHF", "de-CH"),
    CNY("Chinese Yuan", "¥", "zh-CN"),
    AED("UAE Dirham", "د.إ", "ar-AE"),
    SAR("Saudi Riyal", "﷼", "ar-SA"),
    PKR("Pakistani Rupee", "Rs", "en-PK"),
    BDT("Bangladeshi Taka", "৳", "bn-BD"),
    SGD("Singapore Dollar", "$", "en-SG"),
    HKD("Hong Kong Dollar", "$", "en-HK"),
    MYR("Malaysian Ringgit", "RM", "ms-MY"),
    THB("Thai Baht", "฿", "th-TH"),
    PHP("Philippine Peso", "₱", "en-PH"),
    IDR("Indonesian Rupiah", "Rp", "id-ID"),
    VND("Vietnamese Dong", "₫", "vi-VN"),
    KRW("South Korean Won", "₩", "ko-KR"),
    MXN("Mexican Peso", "$", "es-MX"),
    BRL("Brazilian Real", "R$", "pt-BR"),
    ZAR("South African Rand", "R", "en-ZA"),
    SEK("Swedish Krona", "kr", "sv-SE"),
    NOK("Norwegian Krone", "kr", "nb-NO");

    private final String displayName;
    private final String symbol;
    private final String locale;

    Currency(String displayName, String symbol, String locale) {
        this.displayName = displayName;
        this.symbol = symbol;
        this.locale = locale;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getSymbol() {
        return symbol;
    }

    public String getLocale() {
        return locale;
    }

    public String getDisplayValue() {
        return this.name() + " - " + displayName + " (" + symbol + ")";
    }
}
