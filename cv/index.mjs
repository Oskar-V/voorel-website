// @ts-nocheck

// Dynamically set my age on the resume
const age_placeholder = document.getElementById("my-age");
// Divide ms by 3.153e10 to convert them to years
// 9230004e5 is the Unix Epoch equivalent of 02.04.1999
const my_age = Math.floor((new Date().getTime() - 9230004e5) / 3.154e10);
age_placeholder.textContent = my_age;
