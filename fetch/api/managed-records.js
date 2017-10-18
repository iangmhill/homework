import fetch from "../util/fetch-fill";
import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";

// Your retrieve function plus any additional functions go here ...

const constants = {
  PAGE_SIZE: 10,
  MAX_PAGE: 50,
  PRIMARY_COLORS: ['red', 'blue', 'yellow'],
};

function retrieve(options) {
  const page = (options && options.page) ? options.page : 1;
  const colors = (options && options.colors) ? options.colors : [];
  const offset = (page - 1) * constants.PAGE_SIZE;
  const uri = URI(window.path)
      .addSearch('limit', constants.PAGE_SIZE)
      .addSearch('offset', offset)
      .addSearch({ 'color[]': colors });
  return fetch(uri.toString())
  .then((response) => {
    if (response.status !== 200) {
      throw new Error('Retrieve failed.')
    }
    return response.json();
  })
  .then((items) => {
    // Map array of item ids
    const ids = items.map(item => item.id);
    // Bin items by disposition and assign isPrimary
    const { open, closed } = items.reduce((acc, item) => {
      const newItem = Object.assign({}, item, {
        isPrimary: constants.PRIMARY_COLORS.indexOf(item.color) > -1,
      });
      if (newItem.disposition === 'open') {
        return { open: acc.open.concat([newItem]), closed: acc.closed };
      }
      return { open: acc.open, closed: acc.closed.concat([newItem]) };
    }, { open: [], closed: [] });
    // Count items with closed disposition and primary color
    const closedPrimaryCount =
        closed.reduce((acc, item) => acc + (item.isPrimary ? 1 : 0), 0);
    // Set pages and resolve
    return Promise.resolve({
      ids,
      open,
      closedPrimaryCount,
      previousPage: page > 1 ? page - 1 : null,
      nextPage: (page < constants.MAX_PAGE &&
          items.length >= constants.PAGE_SIZE) ? page + 1 : null,
    });
  })
  .catch((err) => {
    console.log(err);
    return Promise.resolve({
      ids: [],
      open: [],
      closedPrimaryCount: 0,
      previousPage: null,
      nextPage: null,
    });
  });
}

export default retrieve;
