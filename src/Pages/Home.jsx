import React from 'react'
import Carousel from '../Component/Carousel'
import CategoryComponent from '../Component/CategoryComponent'
import BestSellers from '../Component/BestSellers'
import Deals from '../Component/Deals'
import InfoBanner from '../Component/InfoBanner'

import LaptopDeals from '../Component/LaptopDeal'
import FridgeDeals from '../Component/FridgeDeals'
import BrandsBanner from '../Component/BrandsBanner'
import PhoneDeals from '../Component/PhoneDeals'
import TeleDeals from '../Component/TeleDeals'

function Home() {
  return (
    <div>
 <Carousel/>

 <CategoryComponent/>
 <Deals/>
 <BestSellers/>
 <InfoBanner/>
<PhoneDeals/>
 <LaptopDeals/>
 <FridgeDeals/>
 <TeleDeals/>
 <BrandsBanner/>
    </div>
  )
}

export default Home
