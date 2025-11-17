# data/read_me_api_wrapper.md

## Whole Foods Mock Dataset — DataAPI Wrapper

This file documents a simple, global **DataAPI** wrapper around your JSON data.

- Stack: **HTML + CSS + vanilla JS**
- Data: `/data/*.json`
- Pattern: Immediately-invoked function expression (IIFE) that exposes a single global: `DataAPI`.

You can include this in a `<script>` tag (e.g., `data_api.js`) and then call:

```js
await DataAPI.load();        // load all JSON
const products = DataAPI.getProducts();
