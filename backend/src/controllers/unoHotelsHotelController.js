const asyncHandler = require('../utils/asyncHandler');
const { listUnoHotels, getUnoHotelDetail } = require('../services/unoHotelsHotelService');

const listHotels = asyncHandler(async (req, res) => {
  const result = await listUnoHotels(req.query);
  res.json(result);
});

const getHotelDetail = asyncHandler(async (req, res) => {
  const hotel = await getUnoHotelDetail({
    city: req.query.city,
    slug: req.query.slug,
  });
  res.json(hotel);
});

module.exports = {
  listHotels,
  getHotelDetail,
};
