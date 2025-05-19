import React from 'react';
import { Outlet }
from 'react-router-dom';

const AdminSecurityPage = () => {
  // This component now primarily serves as a container for the Outlet.
  // The AdminSecurityLayout will provide the sidebar and overall structure.
  // Specific content for /admin/security/overview, /admin/security/honeypots, etc.,
  // will be rendered via the Outlet.
  return (
    <Outlet />
  );
};

export default AdminSecurityPage;
