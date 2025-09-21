import prisma from "@packages/libs/prisma";

// event is expected to contain at least: userId, action, productId, shopId, and optionally city, country, device.
export const updateUserAnalytics = async (event: any) => {
  try {
    // console.log("consumer event", event);
    // console.log("i am inside kafka services");
    // for each event you must send the userId so that we can fetch the existing data
    // we are not going to delete the existing data and add the new DataView, first we have to
    // check the existing data
    // userId      String   @unique   // <-- make it unique because if userId is not marked as @unique, Prisma does not allow you to use it inside .findUnique() or .upsert().
    //   Queries the userAnalytics table to find the document for this userId.
    // userId must be unique in the database for findUnique() to work.
    const existingData = await prisma.userAnalytics.findUnique({
      where: {
        userId: event.userId,
      },
    });

    console.log("exisdata", existingData);
    //     updatedActions starts as the existing array of user actions.
    // If no record exists yet (existingData is null), start with an empty array.
    let updatedActions: any = existingData?.actions || [];
    console.log("up1", updatedActions);
    // for ex: if you are adding item inside wishlist/cart for so many times, we cannot add
    // all the actions in our actions array
    // because user can do mistake and when you are adding same type of similar data for multiple times
    // recommendation system will not be that much strong , hence skip these actions , that the reason if the actionis similar
    // except the product view   then we are not adding that  , we are skippig that

    //check if similar action exists
    const actionExists = updatedActions.some(
      (entry: any) =>
        entry.productId === event.productId && entry.action === event.action
    );
    console.log("acexist", actionExists);
    console.log("evexit", event.action);
    // always store product_view action because when one user is visiting one product for multiple times it means user liked the product, that's
    // why store the product view all the time,Always record product views, even if repeated.
    if (event.action === "product_view") {
      updatedActions.push({
        productId: event?.productId,
        shopId: event.shopId,
        action: event.action,
        timestamp: new Date(),
      });
    }
    // Only add the action if it doesn’t already exist for this product.
    else if (
      ["add_to_cart", "add_to_wishlist"].includes(event.action) &&
      !actionExists
    ) {
      updatedActions.push({
        productId: event?.productId,
        shopId: event.shopId,
        action: event?.action,
        timestamp: new Date(),
      });
    }
    // remove add_to_cart when remove_from_cart is triggered
    else if (event.action === "remove_from_cart") {
      // delete from database,When user removes from cart, delete the corresponding add_to_cart entry.
      updatedActions = updatedActions.filter(
        (entry: any) =>
          !(
            entry.productId === event.productId &&
            entry.shopId === event.shopId &&
            entry.action === "add_to_cart"
          )
      );

      console.log("upactionafterremove", updatedActions);
    }

    // remove add_to_wishlist when remove_from_wishlist is triggered
    else if (event.action === "remove_from_wishlist") {
      // delete from database,similarly remove add_to_wishlist entries.
      updatedActions = updatedActions.filter(
        (entry: any) =>
          !(
            entry.productId === event.productId &&
            entry.action === "add_to_wishlist"
          )
      );
    }

    // keep only the last 100 actions, to avoid lot of storage of our load, we cannot store all the actions, because if one user is using the platform too much then for one user we need to spend a lot of money
    // all the platform keep the new data or new actions of the user, and thats how the recommendation system actually learn from the user activity
    //    Ensures that actions array does not grow indefinitely, keeping only the most recent 100 actions.
    // Older actions are removed from the start of the array.
    if (updatedActions.length > 100) {
      updatedActions.shift();
    }

    // if extrafields are available, update country, city, and device in the analytics record. These fields are stored in the same table.
    const extraFields: Record<string, any> = {};
    // if user is visiting platform fromm usa then add it, next time visiting from india then update that in database
    if (event.country) {
      extraFields.country = event.country;
    }
    if (event.city) {
      extraFields.city = event.city;
    }
    if (event.device) {
      extraFields.device = event.device;
    }
    // update or create user analytics
    // upsert = update if record exists, otherwise create a new one.
    console.log("upactionstoinsert", updatedActions);
    await prisma.userAnalytics.upsert({
      where: { userId: event.userId },
      update: {
        lastVisited: new Date(),
        actions: updatedActions,
        ...extraFields,
      },
      create: {
        userId: event?.userId,
        lastVisited: new Date(),
        actions: updatedActions,
        ...extraFields,
      },
    });

    // also update product analytics
  } catch (error) {
    console.log("Error storing user analytics:", error);
  }
};

export const updateProductAnalytics = async (event: any) => {
  try {
    // If the event doesn’t contain a productId, do nothing
    console.log(event.productId);
    if (!event.productId) return;
    // define update fields dynamically,updateFields will hold dynamic updates depending on the action type.
    const updateFields: any = {};
    // when user is visiting the product , we are updating views of the product by 1
    // Depending on event.action, increment or decrement the corresponding counter.
    if (event.action === "product_view") updateFields.views = { increment: 1 };
    if (event.action === "add_to_cart")
      updateFields.cartAdds = { increment: 1 };
    if (event.action === "remove_from_cart")
      updateFields.cartAdds = { decrement: 1 };
    if (event.action === "add_to_wishlist")
      updateFields.wishListAdds = { increment: 1 };
    if (event.action === "remove_from_wishlist")
      updateFields.wishListAdds = { decrement: 1 };
    if (event.action === "purchase") updateFields.purchases = { increment: 1 };

    // update or create product analytics asynchronously,upsert = update if exists, otherwise create new.
    await prisma.productAnalytics.upsert({
      where: { productId: event.productId },
      update: {
        lastViewedAt: new Date(),
        ...updateFields,
      }, //If not exists → create with initial counters
      create: {
        productId: event.productId,
        shopId: event.shopId || null,
        views: event.action === "product_view" ? 1 : 0, //Initializes counters to 1 if action matches, otherwise 0
        cartAdds: event.action === "add_to_cart" ? 1 : 0,
        wishListAdds: event.action === "add_to_wishlist" ? 1 : 0,
        purchases: event.action === "purchase" ? 1 : 0,
        lastViewedAt: new Date(),
      },
    });
  } catch (error) {
    console.log("Error storing product analytics:", error);
  }
};

// NEW: Shop analytics updater
export const updateShopAnalytics = async (event: any) => {
  try {
    const analytics = await prisma.shopAnalytics.findUnique({
      where: { id: event.shopId },
    });

    // increment or init counters
    const newCountryStats = {
      ...((analytics?.countryStats as Record<string, number>) || {}),
      [event.country]:
        ((analytics?.countryStats as any)?.[event.country] || 0) + 1,
    };

    const newCityStats = {
      ...((analytics?.cityStats as Record<string, number>) || {}),
      [event.city]: ((analytics?.cityStats as any)?.[event.city] || 0) + 1,
    };

    const newDeviceStats = {
      ...((analytics?.deviceStats as Record<string, number>) || {}),
      [event.device]:
        ((analytics?.deviceStats as any)?.[event.device] || 0) + 1,
    };

    await prisma.shopAnalytics.upsert({
      where: { id: event.shopId },
      create: {
        id: event.shopId,
        totalVisitors: 1,
        countryStats: newCountryStats,
        cityStats: newCityStats,
        deviceStats: newDeviceStats,
        lastVistedAt: new Date(),
      },
      update: {
        totalVisitors: { increment: 1 },
        countryStats: newCountryStats,
        cityStats: newCityStats,
        deviceStats: newDeviceStats,
        lastVistedAt: new Date(),
      },
    });
  } catch (error) {
    console.log("Error storing shop analytics:", error);
  }
};

// shift()
// Removes the first element of the array.
// Returns the removed element.
// Mutates (changes) the original array.

// let arr = [10, 20, 30];
// let first = arr.shift();
// console.log(first); // 10
// console.log(arr);   // [20, 30]

// unshift()
// Adds one or more elements to the beginning of the array.
// Returns the new length of the array.
// Mutates the original array.
// let arr = [20, 30];
// let newLength = arr.unshift(10);
// console.log(newLength); // 3
// console.log(arr);       // [10, 20, 30]
