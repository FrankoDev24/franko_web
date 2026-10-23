let page;
export const productPageModule = () => page || (page = import('../Pages/ProductDescription').catch(error => {
  page = undefined;
  throw error;
}));
