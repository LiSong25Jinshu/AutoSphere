/**
 * MessagesPage — used at the /messages route (accessible to all roles).
 * Delegates to the shared MessagingLayout component.
 */
import MessagingLayout from '../components/MessagingLayout';

const MessagesPage = () => <MessagingLayout title="Messages" />;

export default MessagesPage;
