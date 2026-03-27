// src/hooks/useTokenMigration.js
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { migrateCustomerToken } from '../Redux/Slice/customerSlice';
import { migrateUserToken } from '../Redux/Slice/userSlice';

export const useTokenMigration = () => {
  const dispatch = useDispatch();
  const customerMigrated = useSelector((state) => state.customer.tokenMigrated);
  const userMigrated = useSelector((state) => state.user.tokenMigrated);

  useEffect(() => {
    let migrationRun = false;

    const runMigration = async () => {
      if (migrationRun) return;
      migrationRun = true;

      try {
        // Check and migrate customer tokens
        if (!customerMigrated) {
          await dispatch(migrateCustomerToken());
        }

        // Check and migrate user tokens
        if (!userMigrated) {
          await dispatch(migrateUserToken());
        }
      } catch (error) {
        console.warn('Token migration error:', error);
      }
    };

    runMigration();
  }, []); // Run only once on mount
};