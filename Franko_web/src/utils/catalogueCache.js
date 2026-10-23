import { publicGet } from "./publicReadCache";
export const getCatalogue = () => publicGet("/", { params: { endpoint: "/Product/Product-Get" } });
